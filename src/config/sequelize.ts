import {Sequelize as MySequalize} from 'sequelize-typescript';

require('./enviroment');

export const sequelize = new MySequalize({
    repositoryMode: true,
    database: process.env.DATABASE_NAME,
    dialect: "mysql", // NO PUEDE VENIR DEL PROPERTIES YA QUE ES UN ENUM Y SI NO PETA
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWD,
    models: [__dirname + '/../model/']
});