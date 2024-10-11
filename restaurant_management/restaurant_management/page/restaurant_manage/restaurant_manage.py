from __future__ import unicode_literals
import frappe
from erpnext.accounts.doctype.pos_profile.pos_profile import get_item_groups
from erpnext.accounts.doctype.pos_invoice.pos_invoice import get_stock_availability


class RestaurantManage:
    @staticmethod
    def production_center_notify(status):
        object_in_status = frappe.db.get_all("Status Managed Production Center", 
            fields=["parent"], 
            filters={
              "parentType": "Restaurant Object",
              "status_managed": ("in", status)
            }
        )

        for item in object_in_status:
            obj = frappe.get_doc("Restaurant Object", item.parent)
            obj.synchronize()

    @staticmethod
    def common_role(a, b):
        a_set = set(a)
        b_set = set(b)
        if len(a_set.intersection(b_set)) > 0:
            return (True)

        return (False)

    @staticmethod
    def get_rooms():
        restaurant_settings = frappe.get_single("Restaurant Settings")
        filters = {
            "company": frappe.defaults.get_user_default('company'),
            "type": "Room"
        }

        if not restaurant_settings.user_has_admin_role():
            rooms_enabled = restaurant_settings.restaurant_access()

            filters["name"] = ("in", rooms_enabled)

        rooms = frappe.get_all("Restaurant Object",
                                "name,description", filters=filters)

        for room in rooms:
            t = frappe.get_doc("Restaurant Object", room.name)
            room["orders_count"] = t.orders_count

        return rooms

    @staticmethod
    def add_room():
        room = frappe.new_doc("Restaurant Object")
        room.type = "Room"
        room.description = f"R {(RestaurantManage().count_roms() + 1)}"
        room.save()

        return room

    @staticmethod
    def count_roms():
        return frappe.db.count("Restaurant Object", filters={"type": "Room"})

    @staticmethod
    def listener(data):
        for d in data:
            if len(data[d]["data"]) == 0:
                return data

            if d == "Table":
                cond = "and `table` in (%s)" % (
                    ', '.join([f"'{row}'" for row in data[d]["data"]]))

                oc = frappe.db.sql(f"""
                        SELECT `table` as name, count(`table`) as count
                        FROM `tabTable Order`
                        WHERE status = 'Attending' {cond}
                        GROUP by `table`
                        """, as_dict=True)

                for o in oc:
                    data[d]["data"][o.name]["count"] = o.count

            if d == "Room":
                cond = "and `room` in (%s)" % (
                    ', '.join([f"'{row}'" for row in data[d]["data"]]))

                oc = frappe.db.sql(f"""
                        SELECT `room` as name, count(`room`) as count
                        FROM `tabTable Order`
                        WHERE status = 'Attending' {cond}
                        GROUP by `room`
                        """, as_dict=True)

                for o in oc:
                    data[d]["data"][o.name]["count"] = o.count

            if d == "Production Center":
                for pc in data[d]["data"]:
                    production_center = frappe.get_doc("Restaurant Object", pc)

                    data[d]["data"][pc]["count"] = production_center.orders_count_in_production_center

            if d == "Process":
                production_center = frappe.get_doc(
                    "Restaurant Object", data[d]["data"])
                status_managed = production_center.status_managed

                filters = {
                    "status": ("in", [item.status_managed for item in status_managed]),
                    "item_group": ("in", production_center._items_group),
                    "parent": ("!=", "")
                }

                data = dict(Process=frappe.db.get_all(
                    "Order Entry Item", "identifier,status", filters=filters))

        return data


@frappe.whitelist()
def get_rooms():
    return RestaurantManage().get_rooms()


@frappe.whitelist()
def add_room(client=None):
    frappe.publish_realtime("check_rooms", dict(
        client=client,
        current_room=RestaurantManage().add_room().name,
        rooms=RestaurantManage().get_rooms()
    ))


@frappe.whitelist(allow_guest=True)
def get_work_station():
    work_stations = frappe.db.get_all("Work Station")
    work_station = frappe.get_doc("Work Station", work_stations[0].name)
    return {
        "work_station": work_station,
        "pos_profile": frappe.get_doc("POS Profile", work_station.pos_profile)
    }


@frappe.whitelist()
def listeners(args):
    import json
    return RestaurantManage().listener(json.loads(args))


@frappe.whitelist()
def get_settings_data():
    restaurant_settings = frappe.get_single("Restaurant Settings")
    return restaurant_settings.settings_data()


def pos_profile_data():
    restaurant_settings = frappe.get_single("Restaurant Settings")
    return restaurant_settings.pos_profile_data()


def set_settings_data(doc, method=None):
    frappe.publish_realtime("update_settings")


def set_pos_profile(doc, method=None):
    frappe.publish_realtime("pos_profile_update", pos_profile_data())


def notify_to_check_command(command_foods):
    frappe.publish_realtime("notify_to_check_order_data", dict(
        commands_foods=command_foods
    ))


def debug_data(data):
    frappe.publish_realtime("debug_data", data)


@frappe.whitelist()
@frappe.validate_and_sanitize_search_inputs
def get_customer_branches(doctype, txt, searchfield, start, page_len, filters):
	link_name = filters.get('link_name')
	return frappe.db.sql("""
		select `tabAddress`.branch from `tabAddress`, `tabDynamic Link`
			where `tabAddress`.name = `tabDynamic Link`.parent and `tabDynamic Link`.link_name = %(link_name)s
			and `tabDynamic Link`.link_doctype = 'Customer'
			and `tabAddress`.branch like %(txt)s
		""", {
            'link_name': link_name, 'txt': '%%%s%%' % txt
        })

@frappe.whitelist()
def group_items_count():
    groups = frappe.db.get_all("Item Group", fields=["name", "lft", "rgt"], order_by="lft asc")

    items = []
    for group in groups:
        items.append(
            dict(
                item_group=group.name,
                items_count=frappe.db.count("Item", filters={
                    "item_group": ["in", frappe.db.sql_list("select name from `tabItem Group` where lft >= %s and rgt <= %s", (group.lft, group.rgt))]
                })
            )
        )

    return items

@frappe.whitelist()
def get_items(start, page_length, price_list, item_group, pos_profile, item_type=None, search_value="", force_parent=0, in_menu=0):
    data = dict()
    result = []

    allow_negative_stock = frappe.db.get_single_value(
        'Stock Settings', 'allow_negative_stock')
    warehouse, hide_unavailable_items = frappe.db.get_value('POS Profile', pos_profile,
                                                            ['warehouse', 'hide_unavailable_items'])
    if not frappe.db.exists('Item Group', item_group):
        item_group = get_root_of('Item Group')

    if search_value:
        data = search_serial_or_batch_or_barcode_number(search_value)

    item_code = data.get("item_code") if data.get("item_code") else search_value
    serial_no = data.get("serial_no") if data.get("serial_no") else ""
    batch_no = data.get("batch_no") if data.get("batch_no") else ""
    barcode = data.get("barcode") if data.get("barcode") else ""

    if data:
        item_info = frappe.db.get_value(
            "Item", data.get("item_code"),
            ["name as item_code", "item_name", "description", "stock_uom", "image as item_image", "is_stock_item"], as_dict=1)
        item_info.setdefault('serial_no', serial_no)
        item_info.setdefault('batch_no', batch_no)
        item_info.setdefault('barcode', barcode)

        return {'items': [item_info]}

    condition = get_conditions(item_code, serial_no, batch_no, barcode)
    condition += get_item_group_condition(pos_profile)

    lft, rgt = frappe.db.get_value('Item Group', item_group, ['lft', 'rgt'])

    bin_join_selection, bin_join_condition = "", ""
    if hide_unavailable_items:
        bin_join_selection = ", `tabBin` bin"
        bin_join_condition = "AND bin.warehouse = %(warehouse)s AND bin.item_code = item.name AND bin.actual_qty > 0"

    item_group = "='%s'" % item_group if force_parent == '1' else "in (SELECT name FROM `tabItem Group` WHERE lft >= %s AND rgt <= %s)" % (lft, rgt)

    item_type_condition = "AND item_type = '%s'" % item_type if item_type and len(item_type) > 0 else ""
    items_data = frappe.db.sql("""
		SELECT
			item.name AS item_code,
			item.item_name,
			item.description,
			item.stock_uom,
			item.image AS item_image,
			item.is_stock_item,
            item.is_customizable,
            item.item_type
		FROM
			`tabItem` item {bin_join_selection}
		WHERE
			item.disabled = 0
			AND item.has_variants = 0
			AND item.is_sales_item = 1
			AND item.is_fixed_asset = 0
			AND item.item_group {item_group}
            {item_type_condition}
			AND {condition}
			{bin_join_condition}
		ORDER BY
			item.name asc
		LIMIT
			{start}, {page_length}"""
        .format(
        start=start,
        page_length=page_length,
        item_group=item_group,
        item_type_condition=item_type_condition,
        condition=condition,
        bin_join_selection=bin_join_selection,
        bin_join_condition=bin_join_condition
    ), {'warehouse': warehouse}, as_dict=1)

    if items_data:
        items = [d.item_code for d in items_data]
        item_prices_data = frappe.db.get_all("Item Price",
                                          fields=[
                                              "item_code", "price_list_rate", "currency"],
                                          filters={'price_list': price_list, 'item_code': ['in', items]})

        item_prices = {}
        for d in item_prices_data:
            item_prices[d.item_code] = d

        for item in items_data:
            item_code = item.item_code
            item_price = item_prices.get(item_code) or {}
            if allow_negative_stock:
                item_stock_qty = \
                    frappe.db.sql("""select ifnull(sum(actual_qty), 0) from `tabBin` where item_code = %s""", item_code)[0][
                        0]
            else:
                item_stock_qty = get_stock_availability(item_code, warehouse)

            row = {}
            row.update(item)
            row.update({
                'price_list_rate': item_price.get('price_list_rate'),
                'currency': item_price.get('currency'),
                'actual_qty': item_stock_qty,
            })
            result.append(row)

    res = {
        'items': result
    }

    return res


@frappe.whitelist()
def search_serial_or_batch_or_barcode_number(search_value):
	# search barcode no
	barcode_data = frappe.db.get_value('Item Barcode', {'barcode': search_value}, [
	                                   'barcode', 'parent as item_code'], as_dict=True)
	if barcode_data:
		return barcode_data

	# search serial no
	serial_no_data = frappe.db.get_value('Serial No', search_value, [
	                                     'name as serial_no', 'item_code'], as_dict=True)
	if serial_no_data:
		return serial_no_data

	# search batch no
	batch_no_data = frappe.db.get_value(
	    'Batch', search_value, ['name as batch_no', 'item as item_code'], as_dict=True)
	if batch_no_data:
		return batch_no_data

	return {}
    
def get_conditions(item_code, serial_no, batch_no, barcode):
	if serial_no or batch_no or barcode:
		return "item.name = {0}".format(frappe.db.escape(item_code))

	return """(item.name like {item_code}
		or item.item_name like {item_code})""".format(item_code=frappe.db.escape('%' + item_code + '%'))


def get_item_group_condition(pos_profile):
	cond = "and 1=1"
	item_groups = get_item_groups(pos_profile)
	if item_groups:
		cond = "and item.item_group in (%s)" % (', '.join(['%s']*len(item_groups)))

	return cond % tuple(item_groups)

@frappe.whitelist()
def set_item_in_menu(item_code, in_menu):
  pos_data = pos_profile_data()

  if not pos_data.get("has_pos"):
    frappe.throw("POS Profile is not set for this user")
    return
  
  pos = pos_data.get("pos")
  
  if not pos.restaurant_menu:
    frappe.db.set_value("POS Profile", pos.name, "restaurant_menu", frappe.new_doc("Restaurant Menu").insert().name)
    pos.reload()

  menu = frappe.get_doc("Restaurant Menu", pos.restaurant_menu)

  if in_menu == "true":
    if not any(item.get("item") == item_code for item in menu.menu_items):
      menu.append("menu_items", {
        "item": item_code
      })
  else:
    if any(item.get("item") == item_code for item in menu.menu_items):
      for item in menu.menu_items:
        if item.item == item_code:
          menu.menu_items.remove(item)
          break

  menu.save()
  frappe.publish_realtime("update_menu", {"item_code": item_code, "in_menu": in_menu})

  return {"message": "Item added to menu successfully" if in_menu else "Item removed from menu successfully"}
