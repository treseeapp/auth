import * as bodyParser from 'body-parser';
import {Server} from '@overnightjs/core';
import {Logger} from '@overnightjs/logger';

import * as cors from 'cors';
import * as passport from "passport";

import {LoginController} from './controller/LoginController';
import {UsuarioController} from "./controller/UsuarioController";

require('./config/enviroment');

export class Servidor extends Server {

    constructor() {
        super(process.env.NODE_ENV === 'development'); // setting showLogs to true

        /*
        * Parsea el body de las peticiones que recibimos a JSON
        * */
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({extended: true}));

        /*
        * CORS config
        * */
        let whiteList: string = <string>process.env.WHITELIST;
        let array: string[] = whiteList.split(',');

        const options: cors.CorsOptions = {
            origin: array,
            credentials: true,
            allowedHeaders: 'Authorization, Origin, X-Requested-With, Content-Type, Accept',
            methods: 'POST, GET, DELETE, PUT, OPTIONS',
            maxAge: 3600
        };
        this.app.use(cors(options));

        /*
        * Passport
        * */
        this.app.use(passport.initialize());
        this.setupControllers();
    }

    private setupControllers(): void {
        const loginController = new LoginController();
        const userController = new UsuarioController();
        super.addControllers([loginController, userController]);
    }

    public start(port: number): void {
        this.app.listen(port, () => {
            Logger.Imp('Server listening on port: ' + port);
        })
    }
}