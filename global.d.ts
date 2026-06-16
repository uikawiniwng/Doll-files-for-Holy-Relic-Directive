declare module '*?raw' {
  const content: string;
  export default content;
}
declare module '*?url' {
  const content: string;
  export default content;
}
<<<<<<< HEAD
declare module '*.html' {
  const content: string;
  export default content;
}
declare module '*.md' {
  const content: string;
  export default content;
}
=======
>>>>>>> 1fdfca54e89542414750e2c88ad8fca7d4a3f85c
declare module '*.css' {
  const content: unknown;
  export default content;
}
<<<<<<< HEAD
=======
declare module '*.html' {
  const content: string;
  export default content;
}
declare module '*.md' {
  const content: string;
  export default content;
}
>>>>>>> 1fdfca54e89542414750e2c88ad8fca7d4a3f85c
declare module '*.yaml' {
  const content: any;
  export default content;
}
declare module '*.vue' {
  import { DefineComponent } from 'vue';
  const component: DefineComponent;
  export default component;
}

<<<<<<< HEAD
type LiteralUnion<LiteralType, BaseType extends Primitive = string> = import('type-fest').LiteralUnion<
  LiteralType,
  BaseType
>;
type PartialDeep<T> = import('type-fest').PartialDeep<T>;
type SetRequired<BaseType, Keys extends keyof BaseType> = import('type-fest').SetRequired<BaseType, Keys>;
type Primitive = import('type-fest').Primitive;

=======
>>>>>>> 1fdfca54e89542414750e2c88ad8fca7d4a3f85c
declare const YAML: typeof import('yaml');

declare const z: typeof import('zod');
declare namespace z {
  export type infer<T> = import('zod').infer<T>;
  export type input<T> = import('zod').input<T>;
  export type output<T> = import('zod').output<T>;
}

declare module 'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/dist/util/mvu_zod.js' {
<<<<<<< HEAD
  export function registerMvuSchema(schema: z.ZodType<Record<string, any>> | (() => z.ZodType<Record<string, any>>)): void;
=======
  export function registerMvuSchema(
    schema: z.ZodType<Record<string, any>> | (() => z.ZodType<Record<string, any>>),
  ): void;
>>>>>>> 1fdfca54e89542414750e2c88ad8fca7d4a3f85c
}
