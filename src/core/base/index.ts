/**
 * @file index.ts
 * @module core/base
 *
 * @description
 * Экспорт всех базовых модулей
 */

export * from './Core.module';

// extends CoreModule
export * from './Util.module';
export * from './Base.module';

// extends BaseModule
export * from './Middleware.module';
export * from './Router.module';
export * from './Controller.module';
export * from './Service.module';
export * from './OrmDatabase.module';
export * from './TypeOrmPostgres.module';

// export * from './Database.module';
// export * from './Repository.module';
