
class OrderManage extends ObjectManage {
    #objects = {};
    #components = {};
    #items = {};
    #numpad = null;

    constructor(options) {
        super(options);

        this.modal = null;
        this.print_modal = null;
        this.current_order = null;
        this.transferring_order = false;
        this.table_name = this.table.data.name;
        this.order_container_name = `order-container-${this.table_name}`;
        this.order_entry_container_name = `container-order-entry-${this.table_name}`;
        this.editor_container_name = `edit-container-${this.table_name}`;
        this.pad_container_name = `pad-container-${this.table_name}`;
        this.item_container_name = `items-container-${this.table_name}`;
        this.invoice_container_name = `invoice-container-${this.table_name}`;
        this.not_selected_order = null;
        this.init_synchronize();
        this.initialize();
    }

    //get invoice_wrapper() { return document.getElementById(this.invoice_container_name);}
    get objects() { return this.#objects }
    get components() { return this.#components }
    get items() { return this.#items }
    get orders() { return super.children }
    get numpad() { return this.#numpad }

    get container() { return document.getElementById(this.identifier); }
    get order_container() { return document.getElementById(this.order_container_name); }
    get order_entry_container() { return document.getElementById(this.order_entry_container_name); }

    init_synchronize() {
        frappe.realtime.on("pos_profile_update", () => {
            setTimeout(() => {
                this.check_buttons_status();
            }, 0);
        });
    }

    reload() {
        if (!this.is_enabled_to_open()) return;
        this.modal.load_data();
    }

    initialize() {
        if (!this.is_enabled_to_open()) return;
        this.title = this.table.room.data.description + " (" + this.table.data.description + ")";
        this.modal = RMHelper.default_full_modal(
            this.title,
            () => {
                this.make();
            }
        );
    }

    is_enabled_to_open() {
        if (!RM.can_open_order_manage(this.table)) {
            this.close();
            return false;
        }
        return true;
    }

    show() {
        if (!this.is_enabled_to_open()) return;

        this.modal.show();
        if (this.transferring_order) {
            if (this.current_order != null) {
                //**To move windows over the current, on transferring order**//
                this.current_order.edit_form = null;
                this.current_order.divide_account_modal = null;
                this.current_order.pay_form = null;
            }
            this.transferring_order = false;
        }
    }

    close() {
        this.modal.hide()
    }

    make() {
        this.make_dom();
        this.get_orders();
        this.make_items();
        this.make_edit_input();
        this.make_pad();

        if (this.transferring_order && this.current_order != null) {
            this.current_order.edit_form = null;
            this.current_order.divide_account_modal = null;
            this.current_order.pay_form = null;
            this.transferring_order = null;
        }
    }

    is_open() {
        return this.modal.modal.display
    }

    make_dom() {
        this.empty_carts = frappe.jshtml({
            tag: 'div',
            content: RMHelper.no_data('No added items'),
            properties: {
                class: 'empty-carts',
                /*style: 'display: none'*/
            }
        });

        this.not_selected_order = frappe.jshtml({
            tag: 'div',
            properties: { class: "no-order-message" },
            content: RMHelper.no_data('Select or create an Order')
        });

        this.modal.container.append(this.template());

        this.#components.customer = RMHelper.default_button("Customer", 'people', () => this.update_current_order('customer'));
        this.#components.dinners = RMHelper.default_button("Dinners", 'peoples', () => this.update_current_order('dinners'));
        this.#components.delete = RMHelper.default_button("Delete", 'trash', () => this.delete_current_order(), DOUBLE_CLICK);

        //HELKYDS 06-10-2024
        console.log('add print kt');
        this.#components.print_kt = RMHelper.default_button("Print KT", 'print_kt', () => this.print_kitchen(), DOUBLE_CLICK);
        console.log('add print kt_QZ');
        this.#components.print_kt_qz = RMHelper.default_button("Print KT QZ", 'print_kt_qz', () => this.print_kitchen_qz(), DOUBLE_CLICK);


        this.modal.title_container.empty().append(
            RMHelper.return_main_button(this.title, () => this.modal.hide()).html()
        )

        //HELKYDS 06-10-2024
        this.modal.buttons_container.prepend(`
			${this.components.delete.html()}
            ${this.components.customer.html()}
			${this.components.dinners.html()}
            ${this.#components.print_kt.html()}
            ${this.#components.print_kt_qz.html()}
		`);
    }

    template() {
        this.invoice_wrapper = frappe.jshtml({
            tag: 'div',
            properties: {
                id: this.invoice_container_name,
                class: 'product-list',
                style: "height: 100%;"
            },
        });

        this.items_wrapper = frappe.jshtml({
            tag: 'div',
            properties: {
                id: this.item_container_name,
                class: 'product-list',
                style: "height: 100%;"
            },
        });

        return `
		<div class="order-manage" id="${this.identifier}">
			<table class="layout-table">
				<tr class="content-row">
					<td>
						<div class="order-container" id="${this.order_container_name}"></div>
					</td>
					<td class="erp-items" style="width: 100%">
						<div class="content-container">
							${this.items_wrapper.html()}
                            ${this.invoice_wrapper.html()}
                            <div class="col-md-12">
							
							</div>
						</div>
					</td>
					<td class="container-order-items">
						<div class="panel-order-items">
							<ul class="products-list" id="${this.order_entry_container_name}">
								
							</ul>
							${this.empty_carts.html()}
							${this.not_selected_order.html()}
						</div>
						<table class="table no-border table-condensed panel-order-edit" id ="${this.editor_container_name}">
						
						</table>
						<table class="table no-border order-manage-control-buttons pad-container" id="${this.pad_container_name}">
						
						</table>
					</td>
				</tr>
			</table>
		</div>`
    }

    toggle_main_section(option="items"){
        if(option == "items"){
            this.items_wrapper.show();
            this.invoice_wrapper.hide();
        }else{
            this.items_wrapper.hide();
            this.invoice_wrapper.show();
        }
    }

    in_objects(f) {
        Object.keys(this.objects).forEach((key) => {
            f(this.objects[key])
        });
    }

    empty_inputs() {
        this.in_objects(obj => {
            if (["qty", "discount", "rate"].includes(obj.properties.name)) {
                obj.val("", false);
            }
        });
    }

    make_edit_input() {
        const default_class = `input entry-order-editor input-with-feedback center`;

        const objs = [
            {
                name: "Minus",
                tag: 'button',
                properties: {
                    name: 'minus', 
                    class: `btn btn-default edit-button ${default_class}` 
                },
                content: '<span class="fa fa-minus">',
                on: {
                    'click': () => {
                        if (this.num_pad.input && !this.num_pad.input.is_disabled) {
                            this.num_pad.input.minus();
                        }
                    }
                }
            },
            {
                name: "Qty",
                tag: 'button', label: 'Qty',
                properties: { 
                    name: 'qty', type: 'text', input_type: "number",
                    class: default_class
                },
                on: {
                    'click': (obj) => {
                        this.num_pad.input = obj;
                    }
                }
            },
            {
                name: "Discount",
                tag: 'button', label: 'Discount',
                properties: { 
                    name: 'discount', type: 'text', input_type: "number",
                    class: default_class,
                },
                on: {
                    'click': (obj) => {
                        this.num_pad.input = obj;
                    }
                }
            },
            {
                name: "Rate",
                tag: 'button', label: 'Rate',
                properties: { 
                    name: 'rate', type: 'text', input_type: "number",
                    class: default_class
                },
                on: {
                    'click': (obj) => {
                        this.num_pad.input = obj;
                    }
                }
            },
            {
                name: "Plus",
                tag: 'button',
                properties: {
                    name: 'plus',
                    class: `btn btn-default edit-button ${default_class}`
                },
                content: '<span class="fa fa-plus">',
                on: {
                    'click': () => {
                        if (this.num_pad.input && !this.num_pad.input.is_disabled) {
                            this.num_pad.input.plus();
                        }
                    }
                }
            },
            {
                name: "Trash",
                tag: 'button',
                properties: {
                    name: 'trash', 
                    class: `btn btn-default edit-button ${default_class}`
                },
                content: '<span class="fa fa-trash">',
                on: {
                    'click': () => {
                        const current_item = this.current_order ? this.current_order.current_item : null;

                        if (current_item != null) {
                            if (current_item.is_enabled_to_delete) {
                                current_item.delete();
                            } else {
                                frappe.msgprint(__("You do not have permissions to delete Items"));
                            }
                        }
                    }
                }
            }
        ];

        const container = "#" + this.editor_container_name;
        let base_html = "<thead><tr>";
        const width = [10, 20, 20, 20, 10, 10];

        objs.forEach((_obj) => {
            base_html += `
			<th class="center pad-head" style="font-size: 12px; padding: 4px">
				${_obj.label || ""}
			</th>`
        });
        base_html += "</thead><tbody><tr class='edit-values'>";

        objs.forEach((element, index) => {
            base_html += `<td class='${this.table_name}-${index}' style='width: ${width[index]}%;'>`;

            this.#objects[element.name] = frappe.jshtml({
                tag: element.tag,
                properties: element.properties,
                content: (element.content || "")
            }).on(
                Object.keys(element.on)[0], element.on[Object.keys(element.on)[0]], (element.name === "Trash" ? DOUBLE_CLICK : "")
            ).disable();

            base_html += this.objects[element.name].html();
        });
        
        $(container).empty().append(base_html + "</tr></tbody>");

        this.#objects.Qty.int();
        this.#objects.Discount.float(2);
        this.#objects.Rate.float();
    }

    update_detail(input) {
        if (RM.busy) return;

        const set_data = (item, qty, discount, rate) => {
            item.data.qty = qty;
            item.data.discount_percentage = discount;
            item.data.rate = rate;
            item.data.status = "Pending";
            item.update();
            if (qty > 0) {
                item.select();
            }
        }

        if (this.current_order != null && this.current_order.current_item != null) {
            const current_item = this.current_order.current_item;
            if (!current_item.is_enabled_to_edit) {
                return;
            }

            const qty = flt(this.objects.Qty.val());
            let discount = flt(this.objects.Discount.val());
            let rate = flt(this.objects.Rate.val());
            const base_rate = flt(current_item.data.price_list_rate);

            if (input.properties.name === "qty") {
                if (input.val() === 0 && current_item.is_enabled_to_delete) {
                    frappe.msgprint(__("You do not have permissions to delete Items"));
                    current_item.select();
                    return;
                }
                set_data(current_item, qty, discount, rate);
            }
            if (input.properties.name === "discount") {
                rate = (base_rate * (1 - discount / 100));
                set_data(current_item, qty, discount, rate);
            }
            if (input.properties.name === "rate") {
                const _discount = (((base_rate - rate) / base_rate) * 100);
                discount = _discount >= 0 ? _discount : 0
                set_data(current_item, qty, discount, rate);
            }
        }
    }

    make_pad() {
        const default_class = `pad-col ${this.table_name}`;
        this.orders_count_badge = frappe.jshtml({
            tag: 'span',
            properties: { class: 'badge badge-tag badge-btn', style: 'font-size: 12px' },
            content: "{{text}}",
            text: 0
        });

        const num_pads_components = [
            [
                [
                    {
                        name: "Pad",
                        props: { class: "", rowspan: 4, style: "width: 65% !important; padding: 0" },
                        action: "none"
                    },
                    {
                        name: "Order",
                        props: { class: "lg pad-btn btn-success btn-order" },
                        content: `<span class="fa fa-cutlery pull-right"></span>`,
                        action: "order"
                    }
                ]
            ],
            [
                [
                    {
                        name: "Account",
                        props: { class: "lg pad-btn" }, content: '<span class="fa fa-file-o pull-right"></span>',
                        action: "print_account"
                    }
                ]
            ],
            [
                [
                    {
                        name: "Divide",
                        props: { class: "lg pad-btn" }, content: '<span class="fa fa-files-o pull-right"></span>',
                        action: "divide"
                    }
                ]
            ],
            [
                [
                    {
                        name: "Transfer",
                        props: { class: "lg pad-btn" },
                        content: '<span class="fa fa-share pull-right"></span>',
                        action: "transfer"
                    }
                ]
            ],
            [
                [
                    {
                        name: "Tax",
                        props: { class: "pad-label lg", style: "padding-top: 3px;" }, action: "none"
                    },
                    {
                        name: "Pay",
                        props: { class: "md pay-btn text-lg btn-primary", rowspan: 2 }, action: "pay"
                    },
                ],
                {
                    style: "height: 10px;"
                }
            ],
            [
                [
                    {
                        name: "Total",
                        props: { class: "pad-label label-lg lg" }, action: "none"
                    }
                ],
                {
                    style: "height: 15px;"
                }
            ]
        ];

        let base_html = "<tbody>";
        num_pads_components.forEach((row) => {
            const props = typeof row[1] != "undefined" ? row[1] : {};
            base_html += `<tr style='${props.style || ""}'>`;

            row[0].forEach((col) => {
                col.props.class += ` ${default_class}-${col.name}`;
                this.#components[col.name] = frappe.jshtml({
                    tag: "td",
                    properties: col.props,
                    content: "{{text}}" + (col.content || ""),
                    text: __(col.name) + (["Tax", "Total"].includes(col.name) ? ": " + RM.format_currency(0) : "")
                }).on("click", () => {
                    if (col.action !== "none") {
                        if (this.current_order == null) {
                            this.no_order_message();
                            return;
                        }
                        if (this.current_order.has_queue_items()) {
                            frappe.msgprint(__('Adding Items, please white'));
                            return;
                        }
                        setTimeout(`RM.object('${this.identifier}').current_order.${col.action}()`, 0);
                    }
                }, (["order", "transfer"].includes(col.action) ? (!RM.restrictions.to_transfer_order ? DOUBLE_CLICK : null) : ""));

                base_html += this.components[col.name].html();
            });

            base_html += "</tr>";
        });
        $("#" + this.pad_container_name).empty().append(base_html + "</tbody>");

        setTimeout(() => {
            this.num_pad = new NumPad({
                wrapper: this.components.Pad.obj,
                on_enter: () => {
                    if (this.num_pad.input && !this.num_pad.input.is_disabled) {
                        this.update_detail(this.num_pad.input);
                    }
                }
            });
            setTimeout(() => {
                this.check_buttons_status();
            }, 0);
        }, 0);
    }

    is_same_order(order = null) {
        return this.current_order && order && this.current_order.data.name === order.data.name;
    }

    no_order_message() {
        frappe.msgprint("Not order Selected");
    }

    in_components(f) {
        Object.keys(this.components).forEach(k => {
            if (typeof this.#components[k] != "undefined") {
                f(this.components[k], k);
            }
        });
    }

    reset_order_button() {
        this.#components.Order.set_content(
            `<span class="fa fa-cutlery pull-right"></span>${__('Order')}{{text}}`
        ).reset_confirm();
    }

    disable_components() {
        this.reset_order_button();
        this.in_components((component, k) => {
            if (!["Pad", "Tax", "Total"].includes(k)) {
                component.disable();

                if (["delete", "edit", "new", "new_order"].includes(k)) {
                    component.hide();
                }
            }
        });
    }

    check_buttons_status() {
        if (this.current_order == null) {
            this.disable_components();
            if (typeof this.#components.new_order_button != "undefined"){
                this.#components.new_order_button.enable().show();
            }
                
            return;
        } else {
            if (RM.check_permissions("order", null, "create")) {
                if (typeof this.#components.new_order_button != "undefined"){
                    this.#components.new_order_button.enable().show();
                }
            } else {
                if (typeof this.#components.new_order_button != "undefined"){
                    this.#components.new_order_button.disable().hide();
                }
            }
        }

        if (this.current_order.data.status !== "Invoiced") {
            if (this.current_order.items_count === 0) {
                if (RM.check_permissions("order", this.current_order, "delete")) {
                    this.#components.delete.enable().show();
                } else {
                    this.#components.delete.disable().hide();
                }
            } else {
                this.#components.delete.disable().hide();
                this.#components.Pay.prop("disabled", !RM.can_pay);
            }

            if (RM.check_permissions("order", this.current_order, "write")) {
                if (this.current_order.has_queue_items()) {
                    this.#components.Order.enable().add_class("btn-danger").val(__("Add"));
                } else {
                    const orders_count = this.current_order.data.products_not_ordered;
                    this.orders_count_badge.val(`${orders_count}`);
                    const [action, text] = [orders_count > 0 ? "enable" : "disable", orders_count > 0 ? this.orders_count_badge.html() : ""];

                    this.#components.Order.set_content(
                        `<span class="fa fa-cutlery pull-right"></span>${__('Order')}${text}{{text}}`
                    )[action]();
                }

                this.#components.Divide.prop("disabled", this.current_order.items_count === 0);
                this.#components.customer.enable().show();
                this.#components.dinners.enable().show();
                this.#components.Transfer.enable();
                //HELKYDS 06-10-2024
                this.#components.print_kt.enable().show();
                this.#components.print_kt_qz.enable().show();

            } else {
                this.#components.customer.disable().hide();
                this.#components.dinners.disable().hide();
                this.#components.Transfer.disable();
                this.#components.Order.disable();
                this.#components.Divide.disable();
            }
        } else {
            this.disable_components();
        }

        this.#components.Account.prop(
            "disabled",
            !RM.check_permissions("order", this.current_order, "print") || this.current_order.items_count === 0
        );
    }

    check_item_editor_status(item = null) {
        /** item OrderItem class **/
        const objects = this.#objects;
        if (item == null) {
            this.empty_inputs();
            this.in_objects((input) => {
                input.disable();
            });
            return;
        }
        
        const pos_profile = RM.pos_profile
        const data = item.data;
        const item_is_enabled_to_edit = item.is_enabled_to_edit;

        objects.Qty.prop(
            "disabled", !item_is_enabled_to_edit
        ).val(data.qty, false);

        objects.Discount.prop(
            "disabled", !item_is_enabled_to_edit || !pos_profile.allow_discount_change
        ).val(data.discount_percentage, false);

        objects.Rate.prop(
            "disabled", !item_is_enabled_to_edit || !pos_profile.allow_rate_change
        ).val(data.rate, false);

        objects.Minus.prop("disabled", !item_is_enabled_to_edit);
        objects.Plus.prop("disabled", !item_is_enabled_to_edit);
        objects.Trash.prop("disabled", !item.is_enabled_to_delete);

        item.check_status();
    }

    make_items() {
        //console.log(["make_items", this.items_wrapper]);
        this.#items = new ProductItem({
            wrapper: $(`#${this.item_container_name}`),
            order_manage: this,
        });
    }

    storage() {
        return this.#items;
    }

    add_order() {
        //HELKYDS 06-10-2024
        console.log('js - restaurant - order-manage');

        RM.working("Adding Order");
        frappeHelper.api.call({
            model: "Restaurant Object",
            name: this.table.data.name,
            method: "add_order",
            args: { client: RM.client },
            always: (r) => {
                RM.ready();
                if (typeof r.message != "undefined") {
                    RM.sound_submit();
                }
            },
        });
    }

    get_orders(current = null) {
        RM.working(__("Loading Orders in") + ": " + this.title);
        if (current == null) current = this.current_order_identifier;
        frappeHelper.api.call({
            model: "Restaurant Object",
            name: this.table.data.name,
            method: "orders_list",
            args: {},
            always: (r) => {
                RM.ready();
                this.make_orders(r.message, current);
            },
        });
    }

    in_orders(f) {
        this.in_childs((child, key, index) => {
            f(child, key, index);
        })
    }

    check_permissions_status() {
        this.is_enabled_to_open();
        this.in_orders(order => {
            order.button.content = order.content;
            order.button.css(
                "color", RM.check_permissions('order', order, "write") ? "unset" : RM.restrictions.color
            ).val(order.data.items_count);
            if (this.is_same_order(order)) {
                this.check_buttons_status();
                this.check_item_editor_status(order.current_item);
            }
        });
    }

    check_data(data) {
        const _data = data.data.order.data;
        return super.append_child({
            child: _data,
            exist: o => {
                if ([UPDATE, QUEUE, SPLIT].includes(data.action)) {
                    o.reset_data(data.data, data.action);
                } else if ([DELETE, INVOICED, TRANSFER].includes(data.action)) {
                    this.delete_order(o.data.name);
                }
            },
            not_exist: () => {
                const new_order = new TableOrder({
                    order_manage: this,
                    data: Object.assign({}, _data)
                });

                if (RM.client === RM.request_client && new_order) {
                    setTimeout(() => {
                        new_order.select();
                    }, 0);
                }

                return new_order;
            }
        });
    }

    get_order(name) {
        return super.get_child(name);
    }

    make_orders(orders = [], current = null) {
        orders.forEach(order => {
            this.append_order(order, current);
        });
        
        if (this.#components.new_order_button){
            this.#components.new_order_button.remove();
        }

        const new_order_button = frappe.jshtml({
            test_field:true,
            tag: "button",
            properties: {
                class: "btn btn-app btn-lg btn-order",
                style: 'background-color: var(--fill_color)'
            },
            content: `<span class="fa fa-plus"></span>`
        }).on("click", () => {
            this.add_order();
        }, !RM.restrictions.to_new_order ? DOUBLE_CLICK : null);

        this.#components.new_order_button = new_order_button;
        
        if (this.#components.new_order_button) {
            $(this.order_container).prepend(new_order_button.html());
        }
    }

    append_order(order, current = null) {
        return super.append_child({
            child: order,
            not_exist: () => {
                return new TableOrder({
                    order_manage: this,
                    data: Object.assign({}, order.data)
                });
            },
            always: o => {
                if (current != null && current === o.data.name) {
                    setTimeout(() => {
                        o.select();
                    }, 0);
                }
            }
        });
    }

    delete_current_order() {
        if (this.current_order != null) {
            this.current_order.delete();
        }
    }

    update_current_order(type) {
        if (this.current_order != null) {
            this.current_order.edit(type);
        }
    }

    clear_current_order() {
        this.#components.Tax.val(`${__("Tax")}: ${RM.format_currency(0)}`);
        this.#components.Total.val(`${__("Total")}: ${RM.format_currency(0)}`);
        this.check_item_editor_status();

        if (this.current_order != null) {
            this.delete_order(this.current_order.data.name);
        }
    }

    delete_order(order_name) {
        const order = this.get_order(order_name);
        if (order != null) {
            order.delete_items();
            if (this.is_same_order(order)) {
                this.current_order = null;
                this.clear_current_order();
            }
            super.delete_child(order_name);

            order.button.remove();
            order.container.remove();
            this.check_buttons_status();
            this.order_status_message();
        }
    }

    order_status_message() {
        const container = $("#" + this.identifier);
        
        if (this.current_order == null) {
            container.removeClass("has-order");
            container.removeClass("has-items");
        } else {
            container.addClass("has-order");
            if (this.current_order.items_count === 0) {
                container.removeClass("has-items");
            } else {
                container.addClass("has-items");
            }
        }
    }

    //HELKYDS 06-10-2024; Testing Qz-tray
    print_kitchen() {
        $.getScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js', function() {
            console.log('carregou html2canvas...');
        });

        $.getScript('https://cdnjs.cloudflare.com/ajax/libs/bluebird/3.3.5/bluebird.min.js', function() {
            console.log('carregou bluebird...');
        });
        


        $.getScript('https://cdn.jsdelivr.net/npm/jsprintmanager@7.0.1/JSPrintManager.min.js', function() {

            JSPM.JSPrintManager.license_url = "https://jsprintmanager.azurewebsites.net/jspm"
            JSPM.JSPrintManager.auto_reconnect = true;
            JSPM.JSPrintManager.start();
            JSPM.JSPrintManager.WS.onStatusChanged = function () {
                if (jspmWSStatus()) {
                    //get client installed printers
                    JSPM.JSPrintManager.getPrinters().then(function (myPrinters) {
                        var options = '';
                        for (var i = 0; i < myPrinters.length; i++) {
                            options += '<option>' + myPrinters[i] + '</option>';
                        }
                        $('#installedPrinterName').html(options);
                        console.log('Printers .... ', options);
                        print();
                    });
                }
            };
        
            //Check JSPM WebSocket status
            function jspmWSStatus() {
                if (JSPM.JSPrintManager.websocket_status == JSPM.WSStatus.Open)
                    return true;
                else if (JSPM.JSPrintManager.websocket_status == JSPM.WSStatus.Closed) {
                    alert('JSPrintManager (JSPM) is not installed or not running! Download JSPM Client App from https://neodynamic.com/downloads/jspm');
                    return false;
                }
                else if (JSPM.JSPrintManager.websocket_status == JSPM.WSStatus.Blocked) {
                    alert('JSPM has blocked this website!');
                    return false;
                }
            }        
                        
            //Do printing...
            function print(o) {
                if (jspmWSStatus()) {
                    //generate an image of HTML content through html2canvas utility
                    //<div id="savethegirl" style="background-color:coral;color:white;padding:10px;width:200px;">I am a Pretty girl 👩</div>
                    //document.querySelector(".order-entry-container")
                    html2canvas(document.querySelector(".order-entry-container"), {scale:5}).then(function (canvas) {
                    //html2canvas('<div id="savethegirl" style="background-color:coral;color:white;padding:10px;width:200px;">I am a Pretty girl 👩</div>').then(function (canvas) {
                    //html2canvas(document.getElementById('card'), { scale: 5 }).then(function (canvas) {

                        //Create a ClientPrintJob
                        var cpj = new JSPM.ClientPrintJob();
                        //Set Printer type (Refer to the help, there many of them!)
                        if ($('#useDefaultPrinter').prop('checked')) {
                            cpj.clientPrinter = new JSPM.DefaultPrinter();
                        } else {
                            cpj.clientPrinter = new JSPM.InstalledPrinter("POS80"); // new JSPM.InstalledPrinter($('#installedPrinterName').val());
                        }
                        //TESTE USING ESC/POS
                        /*
                        // Create ESC/POS commands
                        var escposCommands = "\x1B\x40"; // Initialize printer
                        escposCommands += "\x1B\x21\x08"; // Emphasized mode
                        escposCommands += "Hello, World!\n";
                        escposCommands += "\x1B\x21\x00"; // Cancel emphasized mode
                        escposCommands += "Thank you for your purchase!\n";
                        escposCommands += "\x1D\x56\x41"; // Cut paper

                        // Add ESC/POS commands to the print job
                        cpj.printerCommands = escposCommands;

                        // Send print job to printer
                        cpj.sendToClient();
                        */

                        //Set content to print...
                        //Create ESP/POS commands for sample label
                        var esc = '\x1B'; //ESC byte in hex notation
                        var newLine = '\x0A'; //LF byte in hex notation
                    
                        var cmds = esc + "@"; //Initializes the printer (ESC @)

                        cmds += esc + '!' + '\x38'; //Emphasized + Double-height + Double-width mode selected (ESC ! (8 + 16 + 32)) 56 dec => 38 hex
                        cmds += 'BEST DEAL STORES'; //text to print
                        cmds += newLine + newLine;
                        cmds += esc + '!' + '\x00'; //Character font A selected (ESC ! 0)
                        cmds += 'COOKIES                   5.00'; 
                        cmds += newLine;
                        cmds += 'MILK 65 Fl oz             3.78';
                        cmds += newLine + newLine;
                        cmds += 'SUBTOTAL                  8.78';
                        cmds += newLine;
                        cmds += 'TAX 5%                    0.44';
                        cmds += newLine;
                        cmds += 'TOTAL                     9.22';
                        cmds += newLine;
                        cmds += 'CASH TEND                10.00';
                        cmds += newLine;
                        cmds += 'CASH DUE                  0.78';
                        cmds += newLine + newLine;
                        cmds += esc + '!' + '\x18'; //Emphasized + Double-height mode selected (ESC ! (16 + 8)) 24 dec => 18 hex
                        cmds += '# ITEMS SOLD 2';
                        cmds += esc + '!' + '\x00'; //Character font A selected (ESC ! 0)
                        cmds += newLine + newLine;
                        cmds += '11/03/13  19:53:17';

                        cmds += newLine;
                        cmds += "\x1D\x56\x41"; // Cut paper                        
                        cmds += newLine + newLine + newLine + newLine;
                        cmds += "\x1D\x56\x41"; // Cut paper

                        cpj.printerCommands = cmds;
                        //Send print job to printer!
                        cpj.sendToClient();                        

                        
                        /*
                        //Set content to print... 
                        var b64Prefix = "data:image/png;base64,";
                        var imgBase64DataUri = canvas.toDataURL("image/png");
                        var imgBase64Content = imgBase64DataUri.substring(b64Prefix.length, imgBase64DataUri.length);

                        var myImageFile = new JSPM.PrintFile(imgBase64Content, JSPM.FileSourceType.Base64, 'myFileToPrint.png', 1);
                        //add file to print job
                        cpj.files.push(myImageFile);


                        //Send print job to printer!
                        cpj.sendToClient();
                        */


                    });
                }
            }
                        
        })


        

    }
    print_kitchen_qz() {
        $.getScript("https://cdnjs.cloudflare.com/ajax/libs/jsrsasign/11.1.0/jsrsasign-all-min.js", function() {
            console.log('Carregou jsrass.... USER O LOCAL MELHOR');

            $.getScript("https://cdn.jsdelivr.net/npm/qz-tray@2.2.4/qz-tray.min.js", function() {
            //$.getScript("/assets/js/qz-tray.min.js", function() {	
                console.log ("Script loaded and executed.");
                
                //$.getScript("/assets/js/sign-message.js", function() {
                //    console.log('Carregou sign-message');
                //})
                qz.security.setCertificatePromise(function(resolve, reject) {
                    //Preferred method - from server
            //        fetch("assets/signing/digital-certificate.txt", {cache: 'no-store', headers: {'Content-Type': 'text/plain'}})
            //          .then(function(data) { data.ok ? resolve(data.text()) : reject(data.text()); });
            
                    //Alternate method 1 - anonymous
            //        resolve();  // remove this line in live environment
            
                    //Alternate method 2 - direct
                    resolve("-----BEGIN CERTIFICATE-----\n" +
                        "MIIFZDCCBEygAwIBAgISBOmw39PanxXJu38jolDeV7Z+MA0GCSqGSIb3DQEBCwUA\n" +
                        "MDMxCzAJBgNVBAYTAlVTMRYwFAYDVQQKEw1MZXQncyBFbmNyeXB0MQwwCgYDVQQD\n" +
                        "EwNSMTEwHhcNMjQxMDA5MDU0MDU2WhcNMjUwMTA3MDU0MDU1WjAcMRowGAYDVQQD\n" +
                        "DBEqLmFuZ29sYWVycC5jby5hbzCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoC\n" +
                        "ggEBAIGqj8ZzZ0bYOFd7COzcwIaESVr+EMxboL6NfZA2LHC1K9tVF8HOInM3GR1F\n" +
                        "fAzXiw4EY9D7wxCNvtPOSA1ANbjwQ2P7M6hKKD/FxMLbOdS8YRAq8VmjSiMz5/do\n" +
                        "xpECgpR9exryPcgEMhi8Uiv6IeBfZs9IQca7D6vvFbHy+hP7fUGAF/dudnuHffK4\n" +
                        "tvoATXghx7393/jxRJz5njKphOfOzDW3XiGljJ+pzUnC23tjXGEqtetn/L3wXRXg\n" +
                        "kriulGjairnAWkrURf0M+GwsABSqq7Hpmtr+T137o3rCLrXVzKgkzbMbQnt21VK3\n" +
                        "NjeSK/pGTcfusehkQ6GuHtD7NrECAwEAAaOCAocwggKDMA4GA1UdDwEB/wQEAwIF\n" +
                        "oDAdBgNVHSUEFjAUBggrBgEFBQcDAQYIKwYBBQUHAwIwDAYDVR0TAQH/BAIwADAd\n" +
                        "BgNVHQ4EFgQUw0miG9OZUB+d2LRDb/1lE5Bbsg0wHwYDVR0jBBgwFoAUxc9GpOr0\n" +
                        "w8B6bJXELbBeki8m47kwVwYIKwYBBQUHAQEESzBJMCIGCCsGAQUFBzABhhZodHRw\n" +
                        "Oi8vcjExLm8ubGVuY3Iub3JnMCMGCCsGAQUFBzAChhdodHRwOi8vcjExLmkubGVu\n" +
                        "Y3Iub3JnLzCBjgYDVR0RBIGGMIGDghEqLmFuZ29sYWVycC5jby5hb4IaKi5mYWN0\n" +
                        "dXJhcy5hbmdvbGFlcnAuY28uYW+CFiouZmFjdHVyYXMubWV0YWdlc3QuYW+CDSou\n" +
                        "bWV0YWdlc3QuYW+CD2FuZ29sYWVycC5jby5hb4INZWxpc3F1YXRyby5hb4ILbWV0\n" +
                        "YWdlc3QuYW8wEwYDVR0gBAwwCjAIBgZngQwBAgEwggEDBgorBgEEAdZ5AgQCBIH0\n" +
                        "BIHxAO8AdQDPEVbu1S58r/OHW9lpLpvpGnFnSrAX7KwB0lt3zsw7CAAAAZJwAP+7\n" +
                        "AAAEAwBGMEQCIFcmwaskxK8aXtEoibs49bUIzLqBRkV2WX63R33u1FdOAiBatDOW\n" +
                        "WOhsytyrDC/sUQT/VsyvitLRot9OnUQQk8eWAQB2AOCSs/wMHcjnaDYf3mG5lk0K\n" +
                        "UngZinLWcsSwTaVtb1QEAAABknAA/58AAAQDAEcwRQIgKic7CsRcvjxzf0q79/lf\n" +
                        "V8xe64INfjDf6M6VYoHQbBACIQDo2uSUNOVYpMgFNH/skwR1HOEMjpLO/n16y3Bq\n" +
                        "FLyQrjANBgkqhkiG9w0BAQsFAAOCAQEAmrLMfHyl4Zq9t/7JTA0rvv07eN8fK4d/\n" +
                        "uKQV7FVcQEKTSwwO49MbUtkSiSONhhWQfHND5h1TEUyavnvzz0XwibYuJTMlt9m6\n" +
                        "ean4pm8/FCYJcsHPuSkyZ1nTkpvl+VsGYVFDPjKjjOQ5LeShFq+JJKH90p1Y2rdg\n" +
                        "FAENFgJaS55KtReGpd7I3LhWbGUd0+7zeKID0gDwXob4sy790TBLKuUR7uB2LZwI\n" +
                        "YUSG+rdyiKM7jSfvOMw3rYj0oZ4QAS7k34CQ2J8mbp/Uet+MPpDC4xj/h2rFpdGe\n" +
                        "ZAi9thWEBymd0AlX58Y5vA4izk+7pm009JmteXQpU4qFN4SgjXMW4A==\n" +
                        "-----END CERTIFICATE-----\n" +
                        "-----BEGIN CERTIFICATE-----\n" +
                        "MIIFBjCCAu6gAwIBAgIRAIp9PhPWLzDvI4a9KQdrNPgwDQYJKoZIhvcNAQELBQAw\n" +
                        "TzELMAkGA1UEBhMCVVMxKTAnBgNVBAoTIEludGVybmV0IFNlY3VyaXR5IFJlc2Vh\n" +
                        "cmNoIEdyb3VwMRUwEwYDVQQDEwxJU1JHIFJvb3QgWDEwHhcNMjQwMzEzMDAwMDAw\n" +
                        "WhcNMjcwMzEyMjM1OTU5WjAzMQswCQYDVQQGEwJVUzEWMBQGA1UEChMNTGV0J3Mg\n" +
                        "RW5jcnlwdDEMMAoGA1UEAxMDUjExMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIB\n" +
                        "CgKCAQEAuoe8XBsAOcvKCs3UZxD5ATylTqVhyybKUvsVAbe5KPUoHu0nsyQYOWcJ\n" +
                        "DAjs4DqwO3cOvfPlOVRBDE6uQdaZdN5R2+97/1i9qLcT9t4x1fJyyXJqC4N0lZxG\n" +
                        "AGQUmfOx2SLZzaiSqhwmej/+71gFewiVgdtxD4774zEJuwm+UE1fj5F2PVqdnoPy\n" +
                        "6cRms+EGZkNIGIBloDcYmpuEMpexsr3E+BUAnSeI++JjF5ZsmydnS8TbKF5pwnnw\n" +
                        "SVzgJFDhxLyhBax7QG0AtMJBP6dYuC/FXJuluwme8f7rsIU5/agK70XEeOtlKsLP\n" +
                        "Xzze41xNG/cLJyuqC0J3U095ah2H2QIDAQABo4H4MIH1MA4GA1UdDwEB/wQEAwIB\n" +
                        "hjAdBgNVHSUEFjAUBggrBgEFBQcDAgYIKwYBBQUHAwEwEgYDVR0TAQH/BAgwBgEB\n" +
                        "/wIBADAdBgNVHQ4EFgQUxc9GpOr0w8B6bJXELbBeki8m47kwHwYDVR0jBBgwFoAU\n" +
                        "ebRZ5nu25eQBc4AIiMgaWPbpm24wMgYIKwYBBQUHAQEEJjAkMCIGCCsGAQUFBzAC\n" +
                        "hhZodHRwOi8veDEuaS5sZW5jci5vcmcvMBMGA1UdIAQMMAowCAYGZ4EMAQIBMCcG\n" +
                        "A1UdHwQgMB4wHKAaoBiGFmh0dHA6Ly94MS5jLmxlbmNyLm9yZy8wDQYJKoZIhvcN\n" +
                        "AQELBQADggIBAE7iiV0KAxyQOND1H/lxXPjDj7I3iHpvsCUf7b632IYGjukJhM1y\n" +
                        "v4Hz/MrPU0jtvfZpQtSlET41yBOykh0FX+ou1Nj4ScOt9ZmWnO8m2OG0JAtIIE38\n" +
                        "01S0qcYhyOE2G/93ZCkXufBL713qzXnQv5C/viOykNpKqUgxdKlEC+Hi9i2DcaR1\n" +
                        "e9KUwQUZRhy5j/PEdEglKg3l9dtD4tuTm7kZtB8v32oOjzHTYw+7KdzdZiw/sBtn\n" +
                        "UfhBPORNuay4pJxmY/WrhSMdzFO2q3Gu3MUBcdo27goYKjL9CTF8j/Zz55yctUoV\n" +
                        "aneCWs/ajUX+HypkBTA+c8LGDLnWO2NKq0YD/pnARkAnYGPfUDoHR9gVSp/qRx+Z\n" +
                        "WghiDLZsMwhN1zjtSC0uBWiugF3vTNzYIEFfaPG7Ws3jDrAMMYebQ95JQ+HIBD/R\n" +
                        "PBuHRTBpqKlyDnkSHDHYPiNX3adPoPAcgdF3H2/W0rmoswMWgTlLn1Wu0mrks7/q\n" +
                        "pdWfS6PJ1jty80r2VKsM/Dj3YIDfbjXKdaFU5C+8bhfJGqU3taKauuz0wHVGT3eo\n" +
                        "6FlWkWYtbt4pgdamlwVeZEW+LM7qZEJEsMNPrfC03APKmZsJgpWCDWOKZvkZcvjV\n" +
                        "uYkQ4omYCTX5ohy+knMjdOmdH9c7SpqEWBDC86fiNex+O0XOMEZSa8DA\n" +
                        "-----END CERTIFICATE-----"); 
                });
            

                var privateKey = "-----BEGIN PRIVATE KEY-----\n" +
                "MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCBqo/Gc2dG2DhX\n" +
                "ewjs3MCGhEla/hDMW6C+jX2QNixwtSvbVRfBziJzNxkdRXwM14sOBGPQ+8MQjb7T\n" +
                "zkgNQDW48ENj+zOoSig/xcTC2znUvGEQKvFZo0ojM+f3aMaRAoKUfXsa8j3IBDIY\n" +
                "vFIr+iHgX2bPSEHGuw+r7xWx8voT+31BgBf3bnZ7h33yuLb6AE14Ice9/d/48USc\n" +
                "+Z4yqYTnzsw1t14hpYyfqc1Jwtt7Y1xhKrXrZ/y98F0V4JK4rpRo2oq5wFpK1EX9\n" +
                "DPhsLAAUqqux6Zra/k9d+6N6wi611cyoJM2zG0J7dtVStzY3kiv6Rk3H7rHoZEOh\n" +
                "rh7Q+zaxAgMBAAECggEAFusOKX3ZSbjK0I+DBtaHwt7b1lTkpDInybZZdKVWmn8z\n" +
                "Jru2DL/B8ApTioxu/hgU0F/vQo9VLXZYPbiOnKT2Od9hkeji+wJMdeUfP2+fG55G\n" +
                "K6TjbrwBTRKOE/k1a4j9ioBZQ2yAhftT3XJftb0qwq0qD0YOtjD29qU1+PNgxyoi\n" +
                "VB+Xci5pA1IH5lOkIo5fLROVDCmJmsP1qBYHFLEGsnQYjJ2yz1dYCFII73sOY4P3\n" +
                "fcV9VnX6xgXS0K8a59SXrtDKM0jtshaMJLBoUaKOxAM/z/9PK8jkuxTS/kU4jNHR\n" +
                "ww2nAHYCq5HbUH6wxvmwJp5+/jUHEK9ocIgS2/lFyQKBgQC2Tj5aW8tNRwoZU78s\n" +
                "CWADTx0LWIJWzfAfTtB//1oesX02l8z6nTRomJAcgQbODucPcLTvMlnJKlD5FzsW\n" +
                "Vk3ouLTJmZy5jPIG1Jtus9L2N2HudLy+vqctBUVbn5KxaW7Bg/x77bSFVB+FxOWU\n" +
                "f8A0cCZ2AAEwMVbuuqvrcAHi9QKBgQC2FPkEi1HCyWPq3375iXvAqenTcRVZRQxi\n" +
                "sCv8wfdD7IIHSRxhqPh0Bw3+aVPL8yKsFloEB82hRZ360Zi1uabzG4ivve7lkrSM\n" +
                "jGFh5O1SyHntcg8NvwJKVne2ekgUgiz5EOB1cErbODEoL3YKqHu3o/ex7fZL8KhJ\n" +
                "LfCF1ZhHTQKBgDx2pueBGmR+8zKDPBx234k5bACfUltH4iQAF9bb8h/L7iN1JV7Z\n" +
                "VNB8CQ/rGz6sYqYUU24h3PWDO2fh9I7sANr2p79VW02PGZZ6XTLSIV3X8HsN7Ku2\n" +
                "v+uGnAJPYm/E8B7uj4bqx7yQsgPD0gD2feDmcVshlUNOme6DqxFjDL0hAoGBAJ/2\n" +
                "BtqmJpsQYBZMaHmC/dRBsalPFGlLjtj4WnyATuE+WvFZmnR1hGgydmnGUJbBL/ms\n" +
                "3UHjNRR0W5ipIBauVewHiWqTWtgWrUU4Yqkk/BWZB/zBElaKMtHp6tvFy6MwxZ+9\n" +
                "4uNpVmoGkLD0GSi94Ypwoz+Oha0rbDx1/nMlNdWVAoGBAJntwgDDMIljIzKC8hXx\n" +
                "8wzkSgcFdOHPaltxy8E/H/tF+HtRqWupYTR0ZFPF0HEqUEu5RsVRWD507Twf7Y11\n" +
                "6cTzgXdrTHIIvgMa+UcKU4QfOWZcLNEa8BYL4TWm0lJFT4u1szdHePruuC13CzpK\n" +
                "optJSuqGciLUsSiPRFVWcUII\n" +
                "-----END PRIVATE KEY-----\n";

                qz.security.setSignatureAlgorithm("SHA512"); // Since 2.1
                qz.security.setSignaturePromise(function(toSign) {
                    return function(resolve, reject) {
                        try {
                            var pk = KEYUTIL.getKey(privateKey);
                            var sig = new KJUR.crypto.Signature({"alg": "SHA512withRSA"});  // Use "SHA1withRSA" for QZ Tray 2.0 and older
                            sig.init(pk);
                            sig.updateString(toSign);
                            var hex = sig.sign();
                            console.log("DEBUG: \n\n" + stob64(hextorstr(hex)));
                            resolve(stob64(hextorstr(hex)));
                        } catch (err) {
                            console.error(err);
                            reject(err);
                        }
                    };
                });
        
                // here you can use anything you defined in the loaded script
                //const qz = require("qz-tray");
                var options = [];
                options['host']=['helkyd-HP-Pavilion-x360-Convertible-14-dy1xxx','192.168.8.214'];
                options['usingSecure']= true;


                qz.websocket.connect(options).then(() => {
                    console.log('ligouuuuuuu');
                    return qz.printers.find();
                }).then((printers) => {
                    console.log(printers);
                    //PRinter 0
                    //To get from USER Settings WHICH PRINTER BAR and KITCHEN
                    let config = qz.configs.create(printers[0]);
                    return qz.print(config, [{
                        type: 'pixel',
                        format: 'html',
                        flavor: 'plain',
                        data: '<h1>Hello JavaScript!</h1>'
                    }]);
                }).then(() => {
                    return qz.websocket.disconnect();
                }).then(() => {
                    // process.exit(0);
                }).catch((err) => {
                    console.error(err);
                    // process.exit(1);
                });            
            });

            //TODO: USAR O LOCAL
        })

    }    
}