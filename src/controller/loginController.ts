import {OK, BAD_REQUEST, UNAUTHORIZED} from 'http-status-codes';
import {Controller, Middleware, Get, Post} from '@overnightjs/core';
import {Request, Response} from 'express';

import {Usuario} from "../model/Usuario";
import {UsuarioService} from "../service/usuarioService";

import * as jwt from "jsonwebtoken";
import * as passport from "passport";
import * as bcrypt from "bcrypt";
import {ModoInicioSesion} from "../model/enum/ModoInicioSesion";

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

        console.log(req.user);

        // Demomento solo guardamos el correo en el token
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
        let contraseña = req.body.contraseña;

        passport.authenticate('local', async function (err: any, info: string) {

            /*

            Esto de aqui hay diferentes maneras de hacerlo si quieres lo comentamos en la reunión
            por si prefieres hacerlo de otro módo.

             */

            let user = new Usuario();
            let userDB: any;
            user.email = email;
            user.contraseña = contraseña;
            let usuarioService = new UsuarioService();

            userDB = await usuarioService.findByEmail(email);

            if (userDB != null) {

                await bcrypt.compare(user.contraseña, userDB.contraseña, function (err, result) {

                    if (result) {

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

                    } else if (userDB.contraseña == "NULL") {
                        return res.status(BAD_REQUEST).json({
                            message: "google user"
                        });
                    }
                });
            } else {
                return res.status(UNAUTHORIZED).json({
                    message: "No user"
                });
            }
        });
    }

    @Post('register')
    private async registerUser(req: Request, res: Response) {

        console.log("Entra en el register");

        return res.status(OK).json({
            message: "Todo OK"
        });

        let userManager = new UsuarioService();

        let usuario = new Usuario();

        usuario.email = req.body.email;

        usuario.apellidos = req.body.apellidos;
        usuario.direccion = req.body.direccion;
        usuario.email = req.body.email;
        usuario.dataNacimiento = req.body.dataNacimiento;
        usuario.contraseña = req.body.contraseña;
        usuario.genero = req.body.genero;
        usuario.modo_inicio_sesion = ModoInicioSesion.LOCAL;
        // Fala el rol

        /*

        El tema imágenes hay que concretar como lo queremos tratar demomento
        lo dejo como que le llega el nombre de la imágen con el que se guarda
        en Amazon. Y que si no tiene ninguna imágen porque el usuario no ha
        puesto imágen cogemos una por defecto.

         */

        /*        if (req.body.foto_perfil == "") {
                    usuario.foto_perfil = process.env.IMAGE_PROFILE_DEFAULT;
                } else {
                    usuario.foto_perfil = req.body.foto_perfil;
                }

                // Aqui podemos controlarlo de otra manera o controlar más campos
                if (usuario.nombre != "" && usuario.email != "" && usuario.contraseña != "") {

                    let BCRYPT_SALT_ROUNDS = 12;

                    await bcrypt.hash(usuario.contraseña, BCRYPT_SALT_ROUNDS, async function (err: Error, hash: any) {
                        usuario.contraseña = hash;

                        // Podemos crear un método que sea userExist en el Service lo comentamos
                        // Y como he comentado en otras partes el controlar si ya está creado como
                        // usuario de google lo podemos hacer de otra manera
                        // O incluso plantear que puedan tener dos cuenas esto no lo hemos hablado

        /!*                await userManager.saveIfNotExist(usuario, async function (exists: boolean, googleUser: boolean) {
                            if (exists) {
                                if (googleUser) {
                                    return res.status(BAD_REQUEST).json({
                                        message: "google user"
                                    })
                                } else {
                                    return res.status(BAD_REQUEST).json({
                                        message: "local user"
                                    })
                                }
                            } else {

                                return res.status(OK).json({
                                    message: "OK"
                                })
                            }
                        });*!/

                    });
                } else {

                    return res.status(BAD_REQUEST).json({
                        message: "Datos del usuario incompletos",
                    })*/
    }

}
