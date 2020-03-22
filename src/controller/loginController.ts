import {OK, BAD_REQUEST, UNAUTHORIZED} from 'http-status-codes';
import {Controller, Middleware, Get, Post} from '@overnightjs/core';
import {Request, Response} from 'express';

import {Usuario} from "../model/Usuario";
import {UsuarioService} from "../service/usuarioService";

import * as jwt from "jsonwebtoken";
import * as passport from "passport";
import * as bcrypt from "bcrypt";

require('../config/enviroment');
require('../config/passport');

@Controller('auth/')
export class LoginController {

    @Get('google')
    @Middleware(passport.authenticate('google', {scope: ['profile', 'email']}))
    private loginGoogle(req: Request, res: Response) {
        res.end();
    }

    @Get('google/callback')
    @Middleware(passport.authenticate('google'))
    private loginGoogleCallBack(req: Request, res: Response) {

        // Demomento solo guardamos el correo en el token
        // Más adelante comentamos si hay que guardar el rol
        const accessToken = jwt.sign({email: req.user}, <string>process.env.JWT_SECRET, {
            expiresIn: process.env.ACCES_TOKEN_EXPIRE,
        });

        const refreshToken = jwt.sign({email: req.user}, <string>process.env.JWT_SECRET, {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRE,
        });

        // Habrá que modificar la ruta si es otra más adelante
        res.redirect(301, process.env.FRONTEND_URL + '/#/admin/?accessToken=' + accessToken + "&refreshToken=" + refreshToken);
    }

    @Post('login')
    private loginLocal(req: Request, res: Response) {

        let email = req.body.email;
        let password = req.body.password;

        console.log(email);
        console.log(password);

        console.log("Entra en el controller de login");

        passport.authenticate('local', async function (err: any, info: string)  {

            /*

            Esto de aqui hay diferentes maneras de hacerlo si quieres lo comentamos en la reunión
            por si prefieres hacerlo de otro módo.

             */

            if (!null) {
                return res.status(UNAUTHORIZED).json({
                    message: "Datos de login inválidos"
                });
            }

            const accessToken = jwt.sign({user: email}, <string>process.env.TOKEN_SECRET_KEY, {
                expiresIn: process.env.ACCES_TOKEN_EXPIRE,
            });

            const refreshToken = jwt.sign({user: email}, <string>process.env.TOKEN_SECRET_KEY, {
                expiresIn: process.env.REFRESH_TOKEN_EXPIRE,
            });

            res.status(OK).json({
                message: "Usuari validat",
                accessToken: accessToken,
                refreshToken: refreshToken,
            })

            /* Esto es para controlar si el usuario esta haciendo login en local cuando es usuario ya en Google */
            /* Como tenemos la aplicación quizá se pueda hacer de otra manera */
            /* Lo comentamos juntos */


        });
    }


    @Post('register')
    private async registerUser(req: Request, res: Response) {

        /*
        El tema imágenes hay que concretar como lo queremos tratar demomento
        lo dejo como que le llega el nombre de la imágen con el que se guarda
        en Amazon. Y que si no tiene ninguna imágen porque el usuario no ha
        puesto imágen cogemos una por defecto.*/

        let foto_perfil;

        if (req.body.foto_perfil == "") {
            foto_perfil = process.env.IMAGE_PROFILE_DEFAULT;
        } else {
            foto_perfil = req.body.foto_perfil;
        }

        let usuarioService = new UsuarioService();

        /*
        Habria que comprobar si este usuario existe porque si no
        dará un error si un usuario ya registrado intenta
        registrarse y también si dejamos que los usuarios de google
         se registren en local o no */

        /*
        ¿Habria que comprobar si los campos vienen llenos aunque lo comprobemos
        en el cliente?. Siento nuestra la API no haría falta pero suponiento que
        no controlaramos el cliente habría que hacerlo.*/

        /*
        Hay que discutir si enviamo ya directamente desde el cliente el rol correctamente
        o lo modificamos aquí, tambíen hay que crear el enum del modo_inicio_sesion */

        console.log(req.body.nombre);

        await usuarioService.createUser({
            idusuario: undefined,
            email: req.body.email,
            contraseña: req.body.contraseña,
            nombre: req.body.nombre,
            apellidos: req.body.apellidos,
            direccion: req.body.direccion,
            genero: 0,
            dataNacimiento: "2005-00-00",
            rol: 0,
            modo_inicio_sesion: 0,
            foto_perfil: foto_perfil
        });

        return res.status(OK).json({
            message: "Todo OK"
        });

        // Si hay error de lo comenado hay que enviar error

    }
}
