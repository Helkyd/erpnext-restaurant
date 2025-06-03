class NumPad {
    #input = null;
    #html = "";
    #grams = false;
    constructor(options) {
        Object.assign(this, options);
        this.make();
    }

    set html(val){this.#html = val}
    set input(val){this.#input = val}

    //FIX 03-06-2025
    set grams(val){this.#grams = val}

    get input(){return this.#input}
    get html(){return this.#html}

    //FIX 03-06-2025
    get grams(){return this.#grams}

    make() {
        console.log('NUM PAD CLASS - MAKE')

        const default_class = `pad-col button btn-default`;

        let num_pads = [
            {
                7: {props: {class: "sm pad-btn"}},
                8: {props: {class: "sm pad-btn"}},
                9: {props: {class: "sm pad-btn"}},
                Del: {
                    props: {class: "md pad-btn"},
                    content: '<span class="fa fa-arrow-left pull-left" style="font-size: 16px; padding-top: 3px"></span>',
                    action: "delete"
                },
            },
            {
                4: {props: {class: "sm pad-btn"}},
                5: {props: {class: "sm pad-btn"}},
                6: {props: {class: "sm pad-btn"}},
                Enter: {
                    props: {class: "md pad-btn", rowspan: "3"},
                    content: '<br><br><span class="fa fa-level-down" style="font-size: 25px; transform: rotate(90deg);"></span>',
                    action: "enter"
                },
            },
            {
                1: {props: {class: "sm pad-btn"}},
                2: {props: {class: "sm pad-btn"}},
                3: {props: {class: "sm pad-btn"}},
            },
            {
                0: {props: {class: "sm pad-btn", colspan: 2}},
                '.': {props: {class: "sm pad-btn"}, action: "key"},
            }
        ];

        //FIX 03-06-2025
        let grams_num_pads = [
            {
                400: {props: {class: "sm pad-btn"}},
                450: {props: {class: "sm pad-btn"}},
                500: {props: {class: "sm pad-btn"}},
                Del: {
                    props: {class: "md pad-btn"},
                    content: '<span class="fa fa-arrow-left pull-left" style="font-size: 16px; padding-top: 3px"></span>',
                    action: "delete"
                },
            },
            {
                250: {props: {class: "sm pad-btn"}},
                300: {props: {class: "sm pad-btn"}},
                350: {props: {class: "sm pad-btn"}},
                Enter: {
                    props: {class: "md pad-btn", rowspan: "3"},
                    content: '<br><br><span class="fa fa-level-down" style="font-size: 25px; transform: rotate(90deg);"></span>',
                    action: "enter"
                },
            },
            {
                100: {props: {class: "sm pad-btn"}},
                150: {props: {class: "sm pad-btn"}},
                200: {props: {class: "sm pad-btn"}},
            },
            {
                0: {props: {class: "sm pad-btn", colspan: 2}},
                '.': {props: {class: "sm pad-btn"}, action: "key"},
            }
        ];

        let html = "<table class='pad-container'><tbody>";
        num_pads.map(row => {
            html += "<tr class='pad-row'>";

            Object.keys(row).map((key) => {
                let col = row[key];
                col.props.class += ` ${default_class}-${key}`;
                html += `${
                    new JSHtml({
                        tag: "td",
                        properties: col.props,
                        content: `{{text}} ${typeof col.content != "undefined" ? col.content : ""}`,
                        text: __(key),
                    }).on("click", () => {
                        if (col.action === "enter") {
                            if (this.on_enter != null) {
                                this.on_enter();
                            }
                        } else if (this.input) {
                            if (col.action === "delete") {
                                this.input.delete_value();
                            } else {
                                this.input.write(key);
                            }
                        }
                    }, "").html()
                }`
            });
            html += "</tr>";
        });
        html += "</tbody></table>";

        this.html = html;

        if (typeof this.wrapper != "undefined") {
            $(this.wrapper).empty().append(this.html);
        }
    }
}