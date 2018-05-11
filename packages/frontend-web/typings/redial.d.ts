declare module "redial" {
  import { ComponentClass, StatelessComponent } from "react";

  type ComponentConstructor<P> = ComponentClass<P> | StatelessComponent<P>;

  type ITriggerableKeys = 'fetch' | 'defer' | 'done';

  interface IHook<T> {
    (locals: T): any;
  }

  // Would love to validate these keys, but can't until TS 2.1
  interface IHooks<T> {
    fetch?: IHook<T>;
    defer?: IHook<T>;
    done?: IHook<T>;
  }

  function provideHooks<T>(hooks?: IHooks<T>): <P>(component: ComponentConstructor<P>) => ComponentConstructor<P>;

  function trigger<T>(key: ITriggerableKeys, components: any[], locals: T): any;
}
