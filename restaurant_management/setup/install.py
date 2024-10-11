from __future__ import unicode_literals
<<<<<<< HEAD
import frappe
from itertools import chain
import os
import json


custom_fields = {
    "POS Profile User": dict(
        restaurant_permission=dict(
            label="Restaurant Permission", fieldtype="Button", options="Restaurant Permission",
            insert_after="User", in_list_view=1, read_only=1
        ),
        parent=dict(label="Parent", fieldtype="Data", hidden=1),
        parenttype=dict(label="Parent Type", fieldtype="Data", hidden=1),
        restaurant_permissions=dict(
            label="Restaurant Permissions", fieldtype="Table", options="Restaurant Permission",
            hidden=1, insert_after="Restaurant Permission"
        )
    ),
    "POS Profile": dict(
        posa_tax_inclusive=dict(
            label="Tax Inclusive", fieldtype="Check", insert_after="tax_category", default_value=1
        ),
        restaurant_settings=dict(
            label="Restaurant Settings", fieldtype="Section Break", insert_after="applicable_for_users"
        ),
        crm_room=dict(label="CRM Room", fieldtype="Link", options="Restaurant Object", insert_after="restaurant_settings"),
        column_break_1=dict(fieldtype="Column Break", insert_after="crm_room"), 
        crm_table=dict(label="CRM Table", fieldtype="Link", read_only=1, options="Restaurant Object", insert_after="column_break_1"),
        restaurant_menu=dict(label="Restaurant Menu", fieldtype="Link", options="Restaurant Menu", insert_after="company"),
    ),
    "POS Invoice Item": dict(
        identifier=dict(label="Identifier", fieldtype="Data"),
        from_customize=dict(label="From Customize", fieldtype="Check"),
        customize_parent=dict(label="Customize Parent", fieldtype="Data", hidden=1),
    ),
    "Sales Invoice Item": dict(
        identifier=dict(label="Identifier", fieldtype="Data"),
        from_customize=dict(label="From Customize", fieldtype="Check"),
        customize_parent=dict(label="Customize Parent", fieldtype="Data", hidden=1),
    ),
    "Address": dict(
        branch=dict(label="Branch", fieldtype="Link", options="Branch", insert_after="address_line1"),
    ),
    "Item Group": dict(
        icon=dict(label="Icon", fieldtype="Data"),
    ),
    "Item": dict(
        customizable=dict(label="Customizable", fieldtype="Section Break", insert_after="description", collapsible=1),
        is_customizable=dict(label="Is Customizable", fieldtype="Check", insert_after="customizable", description="If checked, the item will be customizable"),
        customizable_options=dict(label="Customizable Options", fieldtype="Table", options="Item Customizable", insert_after="is_customizable"),
        section_break_27=dict(fieldtype="Section Break", insert_after="customizable_options", collapsible=1),
        item_type=dict(label="Item Type", fieldtype="Select", options="Veg\nNon-Veg\nVeg/Non-Veg", insert_after="section_break_27"),
        column_break_29=dict(fieldtype="Column Break", insert_after="item_type"),
        cuisine=dict(label="Cuisine", fieldtype="Link", options="Cuisine Type", insert_after="column_break_29"),
    ),
    #"Delivery Charges": dict(
    #    shipping_rule=dict(label="Shipping Rule", fieldtype="Link",
    #                options="Shipping Rule", insert_after="cost_center"),
    #)
}

fields_not_needed = ['parent', 'parenttype', 'restaurant_permissions', 'restaurant_settings', 'crm_room', 'column_break_1', 'crm_table']
fields_has_changed = ['cuisine']

def after_install():
    create_desk_forms()
    clear_custom_fields()
    set_custom_fields()
    set_custom_scripts()
    set_default_data()

def insert_desk_form(form_data):
    desk_form = frappe.new_doc("Desk Form")
    desk_form.update(form_data)
    desk_form.set("docstatus", 0)

    print("    Inserting Desk Form: {}".format(form_data.get("name")))

    desk_form.insert()

def create_desk_forms():
    basedir = os.path.abspath(os.path.dirname(__file__))
    apps_dir = basedir.split("apps")[0] + "apps"

    frappe.db.sql("""DELETE FROM `tabDesk Form`""")
    frappe.db.sql("""DELETE FROM `tabDesk Form Field`""")

    print("Building Desk Forms")

    for app_name in os.listdir(apps_dir):
        print("  Processing Desk Forms for {} App".format(app_name))

        for dirpath, dirnames, filenames in os.walk(os.path.join(apps_dir, app_name, app_name, app_name, "desk_form")):
            for filename in filenames:
                _, extension = os.path.splitext(filename)

                if extension in ['.json']:
                    abspath = os.path.join(dirpath, filename)
                    f = open(abspath)

                    insert_desk_form(json.load(f))
                    f.close()

    print("Building Desk Forms Complete")

def clear_custom_fields():
    for doc in custom_fields:
        for field_name in custom_fields[doc]:
            if (field_name in fields_not_needed or field_name in fields_has_changed):
=======
from faulthandler import disable
import frappe
from itertools import chain

docs = {
    "POS Profile User": dict(
        restaurant_permission=dict(label="Restaurant Permission", fieldtype="Button",
                                   options="Restaurant Permission", insert_after="User", in_list_view=1, read_only=1),
        parent=dict(label="Parent", fieldtype="Data", hidden=1),
        parenttype=dict(label="Parent Type", fieldtype="Data", hidden=1),
        restaurant_permissions=dict(label="Restaurant Permissions", fieldtype="Table",
                                    options="Restaurant Permission", hidden=1, insert_after="Restaurant Permission"),
    ),
    "POS Profile": dict(
        posa_tax_inclusive=dict(
            label="Tax Inclusive", fieldtype="Check", insert_after="tax_category", default_value=1)
    ),
    "POS Invoice Item": dict(
        identifier=dict(label="Identifier", fieldtype="Data"),
    ),
    "Sales Invoice Item": dict(
        identifier=dict(label="Identifier", fieldtype="Data"),
    )
}

fields_not_needed = ['parent', 'parenttype', 'restaurant_permissions']

def after_install():
    clear_custom_fields();
    set_custom_fields()
    set_custom_scripts()

def clear_custom_fields():
    for doc in docs:
        for field_name in docs[doc]:
            if (field_name in fields_not_needed):
>>>>>>> 446759b (removed frapper route upon roume deletion)
                test_field = frappe.get_value(
                    "Custom Field", doc + "-" + field_name)

                if test_field is not None:
                    frappe.db.sql("""DELETE FROM `tabCustom Field` WHERE name=%s""", test_field)

<<<<<<< HEAD
def set_default_data():
    frappe.db.sql("""UPDATE `tabWorkspace` SET public=1 WHERE name = 'Restaurant Management'""")
    frappe.db.sql("""UPDATE `tabWorkspace` SET title='Restaurant Management' WHERE name = 'Restaurant Management'""")
    
    set_default_process_status()
    set_cuisine_types()

def set_default_process_status():
    status = [
        dict(
            action="Draft", icon="fa fa-pencil", color="grey",
            message="Draft", action_message="Submit", allows_to_edit_item="1"
        ),
        dict(
            action="Opened", icon="fa fa-open", color="grey",
            message="Opened", action_message="Take", allows_to_edit_item="1"
        ),
        dict(
            action="Pending",icon="fa fa-cart-arrow-down", color="red",
            message="Pending", action_message="Add", allows_to_edit_item="1"
        ),
        dict(
            action="Attending",icon="fa fa-cart-arrow-down", color="orange",
            message="Attending", action_message="Sent", allows_to_edit_item="1"
        ),
        dict(
            action="Sent", icon="fa fa-paper-plane-o", color="steelblue",
            message="Whiting", action_message="Confirm", allows_to_edit_item="0"
        ),
        dict(
            action="Processing", icon="fa fa-gear", color="#618685",
            message="Processing", action_message="Complete", allows_to_edit_item="0"
        ),
        dict(
            action="Completed", icon="fa fa-check", color="green",
            message="Completed", action_message="Deliver", allows_to_edit_item="0"
        ),
        dict(
            action="Delivering", icon="fa fa-reply", color="#ff7b25",
            message="Delivering", action_message="Deliver", allows_to_edit_item="0"
        ),
        dict(
            action="Delivered", icon="fa fa-cutlery", color="green",
            message='Delivered', action_message="Invoice", allows_to_edit_item="0"
        ),
        dict(
            action="Invoiced", icon="fa fa-money", color="green",
            message="Invoiced", action_message="Invoiced", allows_to_edit_item="0"
        ),
        dict(
            action="Cancelled", icon="fa fa-close", color="red",
            message="Cancelled", action_message="Cancelled", allows_to_edit_item="0"
        ),
        dict(
            action="Closed", icon="fa fa-close", color="red",
            message="Closed", action_message="Closed", allows_to_edit_item="0"
        ),
        dict(
            action="Rejected", icon="fa fa-close", color="red",
            message="Rejected", action_message="Rejected", allows_to_edit_item="0"
        ),
        dict(
            action="Returned", icon="fa fa-close", color="red",
            message="Returned", action_message="Returned", allows_to_edit_item="0"
        ),
        dict(
            action="Refunded", icon="fa fa-close", color="red",
            message="Refunded", action_message="Refunded", allows_to_edit_item="0"
        )
    ]

    for status in status:
        exist = frappe.db.count("Status Order PC", filters=dict(name=status["action"])) > 0

        if exist:
            PS = frappe.get_doc("Status Order PC", status["action"])
        else:
            PS = frappe.new_doc("Status Order PC")

        for key in status:
            PS.set(key, status[key])

        print("    Creating Process Status: {}".format(status["action"]))
        PS.save() if exist else PS.insert()
    print("*"*50)

def set_cuisine_types():
    cuisine_types = ["American", "Asian", "Barbecue", "Chinese", "Continental", "French", "Indian", "Italian", "Japanese", "Mediterranean", "Mexican", "Middle Eastern", "Thai", "Vietnamese"]

    for cuisine in cuisine_types:
        exist = frappe.db.count("Cuisine Type", filters=dict(name=cuisine)) > 0

        if exist:
            print("    Updating Cuisine Type: {}".format(cuisine))
            CT = frappe.get_doc("Cuisine Type", cuisine)
        else:
            print("    Creating Cuisine Type: {}".format(cuisine))
            CT = frappe.new_doc("Cuisine Type")

        for key in cuisine:
            CT.set("description", cuisine)

        
        CT.save() if exist else CT.insert()
    
    print("*"*50)

def set_custom_fields():
    for doc in custom_fields:
        for field_name in custom_fields[doc]:
=======
def set_custom_fields():
    for doc in docs:
        for field_name in docs[doc]:
>>>>>>> 446759b (removed frapper route upon roume deletion)
            if (field_name in fields_not_needed):
                continue

            test_field = frappe.get_value(
                "Custom Field", doc + "-" + field_name)

            if test_field is None or field_name != "posa_tax_inclusive":
                CF = frappe.new_doc("Custom Field") if test_field is None else frappe.get_doc(
                    "Custom Field", test_field)

                _values = dict(chain.from_iterable(d.items() for d in (
<<<<<<< HEAD
                    custom_fields[doc][field_name], dict(dt=doc, fieldname=field_name))))
=======
                    docs[doc][field_name], dict(dt=doc, fieldname=field_name))))
>>>>>>> 446759b (removed frapper route upon roume deletion)

                for key in _values:
                    CF.set(key, _values[key])

                CF.insert() if test_field is None else CF.save()


def set_custom_scripts():
<<<<<<< HEAD
    custom_scripts = {
        "POS Profile": dict(
            doc="POS Profile",
            script="""
frappe.ui.form.on('POS Profile', {
    //
=======
    test_script = frappe.get_value("Client Script", "POS Profile-Form")
    if test_script is None:
        CS = frappe.new_doc("Client Script")
        CS.set("name", "POS Profile-Form")
    else:
        CS = frappe.get_doc("Client Script", test_script)

    CS.set("enabled", 1)
    CS.set("view", "Form")
    CS.set("dt", "POS Profile")
    CS.set("script", """
frappe.ui.form.on('POS Profile', {
    refresh(frm) {
        //refresh
	}
>>>>>>> 446759b (removed frapper route upon roume deletion)
});

frappe.ui.form.on('POS Profile User', {
    restaurant_permission(frm, cdt, cdn) {
        if(cdn.includes('new')){
            frappe.show_alert(__("Save the record before assigning permissions"));
            return;
        }
        
        new DeskForm({
            form_name: 'Restaurant Permission Manage',
            doc_name: cdn,
            callback: (self) => {
                self.hide();
            },
<<<<<<< HEAD
            title: __(`Restaurant Permissions`),
            field_properties: {
                pos_profile_user: {
                  default: cdn  
                },
                'restaurant_permission.object_name': {
                    "get_query": () => {
                        return {
                            filters: [
                                ["company", "=", frm.doc.company],
                    			//['type', '!=', 'Room'],
=======
            title: __(`Room Access`),
            field_properties: {
                pos_profile_user: {
                  value: cdn  
                },
                'restaurant_permission.room': {
                    "get_query": () => {
                        return {
                            filters: [
                    			['type', '=', 'Room']
>>>>>>> 446759b (removed frapper route upon roume deletion)
                    		]
                        }
                    }
                }
            }
        });
    }
});"""
<<<<<<< HEAD
        ),
        "Customer": dict(
            doc="Customer",
            script= """
frappe.ui.form.on('Customer', {
    refresh(frm) {
        /*if(!frm.doc.__islocal) {
            frm.add_custom_button(__('Restaurant Order'), function () {
                window.crm_customer = frm.doc.name;

                frappe.set_route('restaurant-manage');
            }, __('Create'));
        }*/
    }
})"""
        )
    }

    for script in custom_scripts:
        set_custom_script(custom_scripts[script]["doc"], custom_scripts[script]["script"])


def set_custom_script(document, script,  apply_to="Form"):
    script_name = document + "-" + apply_to
    test_script = frappe.get_value("Client Script", script_name)
    
    if test_script is None:
        CS = frappe.new_doc("Client Script")
        CS.set("name", script_name)
    else:
        CS = frappe.get_doc("Client Script", test_script)

    CS.set("enabled", 1)
    CS.set("view", "Form")
    CS.set("dt", document)
    CS.set("script", script)

=======
           )
>>>>>>> 446759b (removed frapper route upon roume deletion)
    CS.insert() if test_script is None else CS.save()
