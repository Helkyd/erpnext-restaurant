// Copyright (c) 2021, Quantum Bit Core and contributors
// For license information, please see license.txt

//LAST MODIFIED: 21-12-2024
frappe.ui.form.on('Table Order', {
	refresh: function(frm) {
		//FIX 21-12-2024; Adding Button PRINT INVOICE
		if (frm.doc.status == "Invoiced") {
			frm.add_custom_button(__('Print Invoice'), function() {

				var order_print = "";
				var ficha_tec = "";
				var orderprint  = "";
			
				frappe.model.with_doc('POS Invoice', frm.doc.link_invoice, function() { 
				  var d = Object.keys(locals['POS Invoice'])[0]
				  frappe.model.with_doctype('POS Invoice', () => {
					let meta = frappe.get_meta("POS Invoice");
					var fichatec = frappe.model.get_doc('POS Invoice', d);
					ficha_tec = fichatec; 
					console.log ('ficccc ', ficha_tec.name);      
					console.log('default template ');
					console.log(meta.__print_formats[1].html);
			
				  }).then((r) => {
					//console.log('TERMINOUIadfsadfsfsafsafasfa');    
					frappe.call({
					  "method": "frappe.www.printview.get_html_and_style",
					  args: {
						doc :"POS Invoice",
						name :ficha_tec.name,
						print_format:"POS Invoice_selling",
						trigger_print:false,
					  },
					  callback: function (r) {
						console.log('dbbbbbbbbbb')
						console.log(r);
						//var print_template_data = r.message.html;
						order_print = r.message.html;
						let print_template_data = frappe.render_template("print_template", {
						  content: order_print, //this.print_template,
						  title: "POS TESTE",
						  base_url: frappe.urllib.get_base_url(),
						  print_css: frappe.boot.print_css,
						  print_settings: locals[":Print Settings"]["Print Settings"],
						  //header: this.letter_head.header,
						  //footer: this.letter_head.footer,
						  landscape: false,
						  lang: "PT",
						  layout_direction: "Portrait",
						  columns: []
			
						})
			
						//console.log('aaaaaaa ', print_template_data);
						
						var w = window.open();
						w.document.write(print_template_data);
						w.document.close();
						setTimeout(function () {
						  w.print();
						  w.close();
						}, 1000)
						
			
					  }
					})
				  })
				})				
			});
		}

	}
});
