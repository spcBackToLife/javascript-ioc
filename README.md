## javascript ioc详解教程
核心流程是使用装饰器，来实现依赖关系的维护。本项目就是javascript实现的一个(控制反转IOC、依赖注入DI)demo。


## 目录结构
-- ioc 

  -- common 辅助工具类（可直接复制哈，感兴趣可以看实现）
    -- async.ts idle-until-urget 思想的实现方式。（使用延迟加载优化性能）
    -- collections.ts 集合操作工具类
    -- type.ts 类型工具类

  -- instantiation ioc核心代码
    -- descriptors.ts 装饰器，装饰需要实例化的类，增加一些属性，比如是否支持延时加载
    -- graph.ts 实例化时，处理依赖关系和循环依赖的有向图，
    -- instatiation.ts 一些结构和辅助方法的定义
    -- instantiationService.ts 实例化服务
    -- serviceCollection.ts 实例存储池子
  
  -- services 服务demo
    --common 服务接口
    ... 其余服务




## 控制反转IoC（Inversion of Control）

1. 控制反转用于削减计算机程序的耦合性，一般分为两种：依赖注入（Dependence Injection 简称DI）、依赖查找（Dependencce Lookup），依赖注入应用比较广泛。

2. 控制反转的是，一个对象获取其依赖的其他对象的引用，这个责任的反转。

3. 与new 对象的区别：
```
  （1）在对象中直接new 其余对象，则叫做正转。
  （2）使用容器来帮忙创建，则是反转。
```

4. 优缺点：
```
(1) 实现组件之间的解耦，提高了灵活性和维护性。
(2) 编程效率降低。
```

## 依赖倒置原则

尽量做到底层依赖上层建筑，而不是上层依赖底层，这样就可以避`免牵一发而动全身`.

比如设计汽车：汽车->车身->底盘->轮子。则可知，上层依赖了最下层的轮子，假设轮子改变大了1号，则整个链路都得改。
换个方式:汽车<-车身<-底盘<-轮子, 则可知下层依赖于上层，那么，下层具体实现动了并不影响上层大框架。这就是依赖倒置原则——把原本的高层建筑依赖底层建筑“倒置”过来，变成底层建筑依赖高层建筑。高层建筑决定需要什么，底层去实现这样的需求，但是高层并不用管底层是怎么实现的。这样就不会出现前面的“牵一发动全身”的情况。

## 控制反转其实是依赖倒置的一种设计思路实现