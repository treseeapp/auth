import {OK, BAD_REQUEST, UNAUTHORIZED} from 'http-status-codes';
import {Controller, Middleware, Get, Post} from '@overnightjs/core';
import {Request, Response} from 'express';

import {Usuario} from "../model/Usuario";
import {UsuarioService} from "../service/usuarioService";

import * as jwt from "jsonwebtoken";
import * as passport from "passport";
import * as bcrypt from "bcrypt";

require('../config/Environment');
require('../config/Passport');

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
        const accessToken = jwt.sign({user: req.user}, <string>process.env.TOKEN_SECRET_KEY, {
            expiresIn: process.env.ACCES_TOKEN_EXPIRE,
        });

        const refreshToken = jwt.sign({user: req.user}, <string>process.env.TOKEN_SECRET_KEY, {
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

        let userManager = new UsuarioService();

        let user = new Usuario();
        user.name = req.body.nombre;
        user.last_name = req.body.apellidos;
        user.last_name = req.body.direccion;
        user.email = req.body.email;
        user.last_name = req.body.dataNacimiento;
        user.last_name = req.body.contraseña;
        user.password = req.body.genero;

        /*

        El tema imágenes hay que concretar como lo queremos tratar demomento
        lo dejo como que le llega el nombre de la imágen con el que se guarda
        en Amazon. Y que si no tiene ninguna imágen porque el usuario no ha
        puesto imágen cogemos una por defecto.

         */

        if (req.body.image == "") {
            user.image = process.env.IMAGE_PROFILE_DEFAULT;
        } else {
            user.image = req.body.image;
        }

        if (user.name != "" && user.email != "" && user.password != "") {

            let BCRYPT_SALT_ROUNDS = 12;

            await bcrypt.hash(user.password, BCRYPT_SALT_ROUNDS, async function (err: Error, hash: any) {
                user.password = hash;
                await userManager.saveIfNotExist(user, async function (exists: boolean, googleUser: boolean) {
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
                }).catch(error => {
                    return res.status(BAD_REQUEST).json({
                        message: 'FALTEN DADES'
                    })
                })
            });
        } else {

            return res.status(BAD_REQUEST).json({
                message: "Dades de l'usuari incompletes",
            })
        }
    }
}