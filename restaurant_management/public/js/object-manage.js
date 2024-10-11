<<<<<<< HEAD
class ObjectManage {
  #children = {};

  constructor(options) {
    Object.assign(this, options);
  }

  append_child(opts) {
    const children = this.children;
    const child = opts.child || null;
    const not_exist_f = opts.not_exist || null;

    if (!child) return;

    if (this.has_child(child.name)) {
      opts.exist && opts.exist(children[child.name]);
    } else {
      if (not_exist_f) this.#children[child.name] = not_exist_f();
    }

    opts.always && opts.always(this.get_child(child.name));

    return this.get_child(child.name);
  }

  has_child(child) {
    const children = this.children;
    return Array.isArray(children) ? children.includes(child) : Object.keys(children).includes(child);
  }

  get children() {
    const children = this.#children;
    return children && typeof children == 'object' ? children : {};
  }

  set children(children) {
    this.#children = children;
  }

  get_child(child) {
    return this.has_child(child) ? this.children[child] : null;
  }

  in_child(f) {
    const children = this.children;
    let index = 0;

    if (Array.isArray(children)) {
      children.forEach((child, key) => {
        f(child, key, index);
        index++;
      });
    } else {
      Object.keys(children).forEach(key => {
        f(children[key], key, index);
        index++;
      });
    }
  }

  delete_child(child) {
    if (this.has_child(child)) delete this.#children[child];
  }

  clear_children() {
    this.#children = {};
  }

  get child_count() {
    return Object.keys(this.children).length;
  }

  get child_names() {
    return Object.keys(this.children);
  }

  get child_values() {
    return Object.values(this.children);
  }

  get_child_by_name(name) {
    return this.get_child(name);
  }

  get_child_by_value(value) {
    let child = null;
    this.in_child((c, key) => {
      if (c == value) child = c;
    });
    return child;
  }

  get_child_by_index(index) {
    return this.child_values[index];
  }

  get_child_by_key(key) {
    return this.get_child(key);
  }

  get_child_by_keys(keys) {
    let child = this;
    keys.forEach(key => {
      child = child.get_child_by_key(key);
    });
    return child;
  }

  get last_child() {
    return this.get_child_by_index(this.child_count - 1);
  }
=======
class ObjectManage{
    #childrend={};

    constructor(options){
        Object.assign(this, options);
    }

    append_child(opts) {
        const childrend = this.childrend;
        const child = opts.child || null;
        const exist_f = opts.exist || null;
        const not_exist_f = opts.not_exist || null;
        const always_f = opts.always || null;

        if(!child) return;

        if (this.has_child(child.name)) {
            if(exist_f) exist_f(childrend[child.name]);
        } else {
            if(not_exist_f) this.#childrend[child.name] = not_exist_f();
        }

        if(always_f){
            always_f(this.get_child(child.name));
        }

        return this.get_child(child.name);
    }



    has_child(child){
        const childrend = this.childrend;
        return Array.isArray(childrend) ? childrend.includes(child) : Object.keys(childrend).includes(child);
    }

    get childrend(){
        const childrend = this.#childrend;
        return childrend && typeof childrend == 'object' ? childrend : {};
    }

    set childrend(childrend){
        this.#childrend = childrend;
    }

    get_child(child){
        return this.has_child(child) ? this.childrend[child] : null;
    }

    in_childs(f){
        const childrend = this.childrend;
        let index = 0;

        if(Array.isArray(childrend)){
            childrend.forEach((child, key) => {
                f(child, key, index);
                index ++;
            });
        }else{
            Object.keys(childrend).forEach(key => {
                f(childrend[key], key, index);
                index ++;
            });
        }
    }

    delete_child(child){
        if(this.has_child(child)) delete this.#childrend[child];
    }
>>>>>>> 446759b (removed frapper route upon roume deletion)
}