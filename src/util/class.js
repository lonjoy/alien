/*!
 * class.js
 * @author ydr.me
 * @create 2014-10-04 15:09
 */


define(function (require, exports, module) {
    /**
     * 类方法
     * @module util/class
     * @requires util/data
     */
    'use strict';

    var data = require('./data.js');

    module.exports = {
        /**
         * 单继承
         * @param {Function} constructor 子类
         * @param {Function} superConstructor 父类
         * @param {Boolean} [isCopyStatic=false] 是否复制静态方法
         * @link https://github.com/joyent/node/blob/master/lib/util.js#L628
         *
         * @example
         * // 父类
         * var Father = function(){};
         *
         * // 子类
         * var Child = function(){
         *     // 执行一次父类的方法
         *     Father.apply(this, arguments);
         *
         *     // 这里执行子类的方法、属性
         *     this.sth = 123;
         * };
         *
         * klass.inherit(Child, Father);
         *
         * // 这里开始写子类的原型方法
         * Child.prototype = {};
         */
        inherit: function (constructor, superConstructor, isCopyStatic) {
            constructor.super_ = superConstructor;
//            var F = function () {
//                // ignore
//            };
//            F.prototype = new superConstructor();
//            constructor.prototype = new F;
            constructor.prototype = Object.create(superConstructor.prototype, {
                constructor: {
                    value: constructor,
                    // 是否可被枚举
                    enumerable: !1,
                    // 是否可被重写
                    writable: !0,
                    // 是否可被修改
                    configurable: !0
                }
            });

            if (isCopyStatic) {
                data.extend(!0, constructor, superConstructor);
            }
        },
        /**
         * 创建一个类（构造函数）
         * @param {Object} property
         * @param {Function} property.constructor 构造函数
         * @param {Object} [property.STATIC]  静态属性
         * @param {Function} [superConstructor] 父类
         * @param {Boolean} [isInheritStatic] 是否继承父类的静态方法
         *
         * @example
         * var Father = klass.create({
         *     // 构造方法
         *     constructor: function (name) {
         *         this.name = name;
         *     },
         *     // 原型属性及方法
         *     say: function () {
         *         console.log('hi, i am ' + this.name);
         *     },
         *     // 静态属性及方法
         *     STATIC: {
         *         a: 1,
         *         b: 2
         *     }
         * });
         *
         * var Child = klass.create({
         *     // 构造方法
         *     constructor: function (name, age) {
         *         Father.apply(this, arguments);
         *         this.age = age;
         *     },
         *     // 原型属性及方法
         *     speak: function () {
         *         console.log(this.name + ' is ' + this.age);
         *     },
         *     // 静态属性及方法
         *     STATIC:{
         *         c: 3,
         *         d: 4
         *     }
         * }, Father, true);
         *
         * var f1 = new Father('Fimme');
         * var c1 = new Child('Cmoo', 20);
         *
         */
        create: function (property, superConstructor, isInheritStatic) {
            var type = data.type(property);
            var constructorType;
            var superConstructorType = data.type(superConstructor);
            var STATIC;

            if (type !== 'object') {
                throw new Error('property must be an object');
            }

            // 必须有构造函数
            if (!data.hasOwnProperty(property, 'constructor')) {
                throw new Error('property must be have a `constructor` function');
            }

            constructorType = data.type(property.constructor);

            if (constructorType !== 'function') {
                throw new Error('property constructor must be a function');
            }

            if (superConstructorType !== 'undefined' && superConstructorType === 'function') {
                this.inherit(property.constructor, superConstructor, isInheritStatic);
            }

            STATIC = property.STATIC || {};
            delete(property.STATIC);

            // 必须静态对象
            if (data.type(STATIC) !== 'object') {
                throw new Error('constructor static property must be an object');
            }

            // 不能重写静态`super_`属性，保留字段
            if (STATIC.super_) {
                throw new Error('unable to rewrite constructor static property super_ value');
            }

            // 添加静态方法、属性
            data.each(STATIC, function (key, val) {
                if (key !== 'prototype') {
                    property.constructor[key] = val;
                }
            });

            // 添加原型链方法、属性
            data.each(property, function (key, val) {
                property.constructor.prototype[key] = val;
            });

            // 添加默认方法
            if (property.constructor.prototype.getOptions === undefined) {
                property.constructor.prototype.getOptions = function (key) {
                    var the = this;
                    var keyType = data.type(key);
                    var ret = [];

                    if (keyType === 'string' || keyType === 'number') {
                        return the.options[key];
                    } else if (keyType === 'array') {
                        data.each(key, function (index, k) {
                            ret.push(the.options[k]);
                        });

                        return ret;
                    }
                };
            }

            if (property.constructor.prototype.setOptions === undefined) {
                property.constructor.prototype.setOptions = function (key, val) {
                    var the = this;
                    var keyType = data.type(key);

                    if (keyType === 'string' || keyType === 'number') {
                        return the.options[key] = val;
                    } else if (keyType === 'object') {
                        data.extend(the.options, key);
                    }
                };
            }

            return property.constructor;
        }
    };
});