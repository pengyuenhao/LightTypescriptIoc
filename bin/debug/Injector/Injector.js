/* import { InjectFactory } from "./InjectFactory"
import { InjectBinder } from "./InjectBinder";
import { InjectBinding } from "./InjectBinding";
import { InjectConst} from "./InjectConst";
import { DecoratorClass } from "../Decorator/DecoratorClass";
import { DecoratorClassBinder } from "../Decorator/DecoratorClassBinder";
import { Binding } from "../Bind/Binding";
 */
var ioc;
(function (ioc) {
    var Injector = /** @class */ (function () {
        function Injector() {
            this.factory = null;
            this.binder = null;
            this.injectClassBinder = null;
            this.factory = new ioc.InjectFactory();
        }
        Injector.prototype.uninject = function (target) {
            if (!this.binder || !target)
                throw new Error("Attempt to inject into Injector without a Binder or null instance");
            //排除一些不能被注入的类型
            var type = typeof target;
            if (type === "string" || type === "boolean" || type === "number" || type === "symbol" || type === "undefined" || type === "function") {
                return target;
            }
            //获取注入类
            var injectClass = this.injectClassBinder.get(target);
            this.decoratorUnInject(target, injectClass);
        };
        Injector.prototype.decoratorUnInject = function (target, injectClass) {
            var that = this;
            //遍历注入类
            injectClass.list.forEach(function (binding) {
                //尝试获绑定状态
                var injectBinding = that.binder.getBinding(binding.value, binding.name);
                //不能注入一个未绑定的值
                if (injectBinding) {
                    //将注入值赋给目标对象
                    target[binding.property] = null;
                }
            });
        };
        //实例化对象
        Injector.prototype.instantiate = function (binding, tryInjectHere) {
            //检查是否具备注入条件
            if (!this.binder || !this.factory)
                throw new Error("Attempt to instantiate from Injector without a Binder or inject into Injector without a Factory");
            //构造函数
            var constructor = null;
            //实例对象
            var instance = null;
            //检查绑定状态的值是否为构造函数
            if (binding.isValueConstructor) {
                //传入构造函数
                constructor = binding.value;
            }
            else {
                //直接赋值
                instance = binding.value;
            }
            //如果没有设置注入值但是键值是一个构造函数
            if (!constructor && binding.isKeyConstructor) {
                //指定绑定状态的键值为构造函数
                constructor = binding.key;
            }
            //如果没有直接赋值实例并且存在构造函数
            if (!instance && constructor) {
                //参数
                var args = binding.getArgs();
                instance = this.factory.get(binding, args);
                //如果尝试在这里直接注入
                if (tryInjectHere) {
                    this.tryInject(binding, instance);
                }
            }
            return instance;
        };
        Injector.prototype.tryInject = function (binding, target) {
            //如果工厂不能创建实例则这里直接返回
            if (target != null) {
                if (binding.isInject()) {
                    target = this.inject(target, false);
                }
                if (binding.getBindingType() == "Singleton" /* SINGLETON */ || binding.getBindingType() == "Value" /* VALUE */) {
                    //prevent double-injection
                    binding.toInject(false);
                }
            }
            return target;
        };
        //注入目标中所有被@Inject标记的属性
        Injector.prototype.inject = function (target, attemptConstructorInjection) {
            if (!this.binder || !target)
                throw new Error("Attempt to inject into Injector without a Binder or null instance");
            //排除一些不能被注入的类型
            var type = typeof target;
            if (type === "string" || type === "boolean" || type === "number" || type === "symbol" || type === "undefined" || type === "function") {
                return target;
            }
            //因为TS中无法获得类型名称，所以使用目标的构造函数名称代替类型名称
            //let typeName : string = target.constructor;
            //获取注入类
            var injectClass = this.injectClassBinder.get(target);
            //是否允许使用构造器注入
            if (attemptConstructorInjection) {
                //target = performConstructorInject(target, reflection);
            }
            this.decoratorInject(target, injectClass);
            //performSetterInject(target, reflection);
            //postInject(target, reflection);
            return target;
        };
        /**
         * 装饰器注入，使用注入类进行注入
         */
        Injector.prototype.decoratorInject = function (target, injectClass) {
            var that = this;
            //遍历注入类
            injectClass.list.forEach(function (binding) {
                //console.info("[装饰器注入]"+binding.value + "[别名]"+binding.name);
                //尝试获绑定状态
                var injectBinding = that.binder.getBinding(binding.value, binding.name);
                //不能注入一个未绑定的值
                if (injectBinding) {
                    var instance = that.getInjectValue(injectBinding.key, injectBinding.name);
                    //将注入值赋给目标对象
                    target[binding.property] = instance;
                }
            });
        };
        /**
         * 获取需要注入的值，这个过程会递归调用
         * @see 注意循环依赖会严重消耗性能
         */
        Injector.prototype.getInjectValue = function (type, name) {
            //尝试获取绑定状态
            var binding = this.binder.getBinding(type, name);
            if (!binding)
                return null;
            //if(binding.key.name)console.info("[获取注入值]"+binding.key.name+"[别名]"+name+"[绑定状态]"+binding.bindingType + ","+binding.isInject);
            //else console.info("[获取注入值]"+binding.key+"[别名]"+name+"[绑定状态]"+binding.bindingType + "[需要注入]"+binding.isInject);
            //如果是值类型绑定
            if (binding.getBindingType() === "Value" /* VALUE */) {
                //如果需要注入
                if (binding.isInject()) {
                    var injv = this.inject(binding.value, false);
                    //值类型完成一次注入后不再进行注入
                    binding.toInject(false);
                    return injv;
                }
                else {
                    return binding.value;
                }
                //如果是单例注入
            }
            else if (binding.getBindingType() == "Singleton" /* SINGLETON */) {
                //如果绑定状态的值是一个构造函数
                if (binding.isValueConstructor || binding.value == null) {
                    this.instantiate(binding, true);
                }
                return binding.value;
            }
            else {
                return this.instantiate(binding, true);
            }
        };
        return Injector;
    }());
    ioc.Injector = Injector;
})(ioc || (ioc = {}));
//# sourceMappingURL=Injector.js.map