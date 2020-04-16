import {BAD_REQUEST, OK, UNAUTHORIZED} from 'http-status-codes';
import {Controller, Get, Middleware, Post, Put} from '@overnightjs/core';
import {Request, Response} from 'express';
import {UsuarioService} from "../service/UsuarioService";
import * as passport from "passport";
import {TokenService} from "../service/TokenService";
import {ModoInicioSesion} from "../model/enum/ModoInicioSesion";
import {CaptchaService} from '../service/CaptchaService'
import {Rol} from "../model/enum/Rol";
import {Genero} from "../model/enum/Genero";
import * as Mailgun from "mailgun-js";

require('../config/enviroment');
require('../config/passport');

@Controller('auth/')
export class LoginController {

    /*
    * Variables genericas para toda la clase
    * */
    private usuarioService: UsuarioService;
    private tokenService: TokenService;

    constructor() {
        this.usuarioService = new UsuarioService();
        this.tokenService = new TokenService();
    }

    /*
    * ------------------
    *
    *  Endpoints oAuth
    *
    * ------------------
    * */

    /*
    *Endpoint para hacer oauth con google
    * */
    @Get('google')
    @Middleware(passport.authenticate('google', {scope: ['profile', 'email', 'https://www.googleapis.com/auth/user.addresses.read', 'https://www.googleapis.com/auth/user.birthday.read']}))
    private loginGoogle(req: Request, res: Response) {
        res.end();
    }

    /*
    * Endpoint CB si el login de
    * google ha ido bien la autenticacion
    * */
    @Get('google/callback')
    @Middleware(passport.authenticate('google', {
        failureRedirect: '/auth/failure'
    }))
    private loginGoogleCallBack(req: Request, res: Response) {

        const usuario = <any>req.user;

        const accessToken = this.tokenService.tokenGenerator(usuario);
        const refreshToken = this.tokenService.tokenGenerator(usuario, process.env.REFRESH_TOKEN_EXPIRE);
        const rol = Rol[usuario.rol];

        // Habrá que modificar la ruta si es otra más adelante
        res.redirect(301, process.env.FRONTEND_URL + '/?accessToken=' + accessToken + '&refreshToken=' + refreshToken + '&rol=' + rol + '#/login/callback');
    }

    /*
    * Endpoint para comenzar el oAuth con facebook
    * */
    @Get('facebook')
    @Middleware(passport.authenticate('facebook', {scope: ['email', 'public_profile']}))
    private loginFacebook(req: Request, res: Response) {
        res.end();
    }

    /*
    * Endpoint CB si el login de
    * facebook ha ido bien la autenticacion
    * */
    @Get('facebook/callback')
    @Middleware(passport.authenticate('facebook', {
        failureRedirect: '/auth/failure'
    }))
    private loginFacebookCallBack(req: Request, res: Response) {

        const usuario = <any>req.user;

        const accessToken = this.tokenService.tokenGenerator(usuario);
        const refreshToken = this.tokenService.tokenGenerator(usuario, process.env.REFRESH_TOKEN_EXPIRE);
        const rol = Rol[usuario.rol];
        // Habrá que modificar la ruta si es otra más adelante
        res.redirect(301, process.env.FRONTEND_URL + '/?accessToken=' + accessToken + '&refreshToken=' + refreshToken + '&rol=' + rol + '#/login/callback');
    }

    /*
    * Endpoint de failure para los OAUTH
    * */
    @Get('failure')
    private loginGoogleCallBackFailure(req: Request, res: Response) {
        res.redirect(301, process.env.FRONTEND_URL + '/#/login/');
    }

    /*
    * ------------------
    *
    *  Endpoint local
    *
    * ------------------
    * */
    @Post('login')
    private async loginLocal(req: Request, res: Response) {

        /*
        * Cedemos a passport el autenticar nuestro usuario
        * */
        passport.authenticate('local',
            {
                session: false
            },
            /*
            * Una vez autenticado, passport llamara a este
            * callback el cual recibe el usuario loggeado / false si no se ha podido
            * */
            (req, usuario, info) => {

                /*
                * TODO cambiar esto por el cb de error que cambiaremos en el passport local
                * */
                if (!usuario) {
                    res.status(UNAUTHORIZED).statusMessage = 'Datos de login no validos.';
                    return res.end();
                }

                /*
                * Creamos los dos tokens que necesitara el usuario
                *
                * La passwd nucna va al token, por eso en el token generator la quitamos
                * */

                const token = this.tokenService.tokenGenerator(usuario.dataValues);
                const refreshToken = this.tokenService.tokenGenerator(usuario.dataValues, process.env.REFRESH_TOKEN_EXPIRE);
                const rol = Rol[usuario.rol];

                return res.status(OK).json({
                    accessToken: token,
                    refreshToken: refreshToken,
                    rol: rol
                })

            })(req, res);
    }

    /*
    * Endpoint para poder registrar un usuario
    * */
    @Post('register')
    private async registerUser(req: Request, res: Response) {
        const tokenCaptcha = req.body.tokenCaptcha;
        if (tokenCaptcha === '' || tokenCaptcha === null) {
            res.status(BAD_REQUEST).statusMessage = " NO SE HA RECIBIDO EL CAPTCHA TOKEN ";
            return res.end();
        }
        const captchaService = new CaptchaService();
        const resultado = await captchaService.validateToken(tokenCaptcha);
        if (!resultado) {
            res.status(BAD_REQUEST).statusMessage = " No has pasado el captcha ";
            return res.end();
        }


        /*
        * TODO mirar como hacer captcha para registrar usuario
        * */

        const email = req.body.email;
        const contraseña = req.body.contraseña;
        const contraseña2 = req.body.contraseña2;
        const nombre = req.body.nombre;
        const apellidos = req.body.apellidos;
        const dataNacimiento = req.body.dataNacimiento;
        const generoRecibido = <string>req.body.genero;

        const result = <any>await this.usuarioService.findByEmail(email);

        /*
        * Comprovamos que el usuario ya no exista
        * */
        if (result !== null) {
            res.status(BAD_REQUEST).statusMessage = 'Email ya en uso.';
            return res.end();
        }

        /*
        * Validamos la contrasña
        * · que coincida (done)
        * · que tenga los caracteres minimos
        * */
        if (contraseña !== contraseña2) {
            res.status(BAD_REQUEST).statusMessage = 'Las contraseñas no coinciden.';
            return res.end();
        }

        /*
        * Comprobamos que tiene entre 8 y 20 carácteres, que contiene
        * almenos una letra mayúscula y almenos un número.
        * */

        if (!/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,20}$/.test(contraseña)) {
            res.status(BAD_REQUEST).statusMessage = "La contraseña no es válida.";
            return res.end();
        }

        /*
        * Comprobamos que el correo sea válido con una
        * expresión regular que contempla el formato básico
        * de un correo así como también todos los TLD válidos.
        * */

        if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
            res.status(BAD_REQUEST).statusMessage = "El email no es válido.";
            return res.end();
        }

        /*
        * Miramos que recibimos los campos obligtorios desde el cliente
        * */
        if (email !== "" && email !== null && email !== undefined &&
            contraseña !== "" && contraseña !== null && contraseña !== undefined &&
            contraseña2 !== "" && contraseña2 !== null && contraseña2 !== undefined &&
            nombre !== "" && nombre !== null && nombre !== undefined &&
            apellidos !== "" && apellidos !== null && apellidos !== undefined) {

            let genero = Genero.INDEFINIDO;
            if (generoRecibido.toLowerCase() == "hombre") genero = Genero.HOMBRE;
            else if (generoRecibido.toLowerCase() == "mujer") genero = Genero.MUJER;

            const direccion = (req.body.direccion === '') ? null : req.body.direccion;

            /*
            *  Creamos el usuario
            * */
            await this.usuarioService.createUser({
                email: email,
                contraseña: contraseña,
                nombre: nombre,
                apellidos: apellidos,
                direccion: direccion,
                genero: genero,
                dataNacimiento: dataNacimiento,
                rol: Rol.ESTUDIANTE,
                modo_inicio_sesion: ModoInicioSesion.LOCAL,

            });

            const userCreated = await this.usuarioService.findByEmail(email);

            const accessToken = this.tokenService.tokenGenerator(userCreated.dataValues);
            const refreshToken = this.tokenService.tokenGenerator(userCreated.dataValues, process.env.REFRESH_TOKEN_EXPIRE);
            const rol = Rol[userCreated.dataValues.rol];

            return res.status(OK).json({
                accessToken: accessToken,
                refreshToken: refreshToken,
                rol: rol
            }).end();
        } else {
            res.status(BAD_REQUEST).statusMessage = "Faltan campos obligatorios.";
            return res.end();
        }
    }

    /*
    * Endpoint para realizar un refresh de tu token
    * */
    @Post('refresh/token')
    private async newToken(req: Request, res: Response) {

        const refreshToken = <string>req.header("Authorization");

        if (!refreshToken && refreshToken === '') {
            res.status(BAD_REQUEST).statusMessage = "Refresh token no recibido.";
            return res.end();
        }

        /*
        * Primer paso ! Validamos refresh token
        *
        * 401  + mensaje
        * */
        const validate = this.tokenService.validateToken(refreshToken);

        if (!validate) {
            res.status(UNAUTHORIZED).statusMessage = "Token no valido.";
            return res.end();
        }

        /*
        * Si el refreshToken es válido
        *
        * Creamos un acces y un refresh token nuevos
        * */
        const email = this.tokenService.getEmail(refreshToken);
        const usuario = <any>await this.usuarioService.findByEmail(email);

        const newAccesToken = this.tokenService.tokenGenerator(usuario.dataValues);
        const newRefreshToken = this.tokenService.tokenGenerator(usuario.dataValues, process.env.REFRESH_TOKEN_EXPIRE);

        /*
        * Enviamos el response al cliente
        * */
        res.status(OK).json({
            accessToken: newAccesToken,
            refreshToken: newRefreshToken
        });
    }

    @Post('recover/password')
    private async emailRecoverPassword(req: Request, res: Response) {

        const email = req.body.email;
        const tokenCaptcha = req.body.tokenCaptcha;

        if (email == '' || email == null || tokenCaptcha == '' || tokenCaptcha == null) {
            res.status(BAD_REQUEST).statusMessage = "No se han recibido los parametros correctos";
            return res.end()
        }


        /*
        * Si el captcha no valida, no enviamos email, ya que podria ser un robot
        * */
        const captchaService = new CaptchaService();
        const resultado = await captchaService.validateToken(tokenCaptcha);
        if (!resultado) {
            res.status(BAD_REQUEST).statusMessage = " No has pasado el captcha roboto !";
            return res.end();
        }

        /*
        * Comprobamos si el email recibido existe en la bbdd
        *
        * No se da ningun error ni nada para que un posible cracker no tenga ningun tipo de informacion
        * */
        let usuario = <any>await this.usuarioService.findByEmail(email);
        if (usuario == null) {
            return res.end();
        }
        usuario = usuario.dataValues;

        /*
        * Solo se envia un email si el usuario inicia sesion de modo local
        *
        * No se da ningun error ni nada para que un posible cracker no tenga ningun tipo de informacion
        * */
        if (usuario.modo_inicio_sesion !== ModoInicioSesion.LOCAL) {
            return res.end();
        }

        /*
        * Generamos un token JWT el qual se utilizara para recuperar la contraseña
        * */
        const tokensito = this.tokenService.tokenGenerator({
            email: email
        }, '12h');


        /*
        * Preparamos el link que nos servira para que se recupere la contraseña
        * */
        const domain = process.env.MAILGUN_DOMAIN + '';
        const api_key = process.env.MAILGUN_API_KEY || '';

        const linkReset = process.env.FRONTEND_URL + '/?tokenUserModify=' + tokensito;
        const mailer = new Mailgun({
            apiKey: api_key,
            domain: domain,
            host: "api.eu.mailgun.net"

        });

        const mensaje = {
            from: 'no-reply <bot@' + process.env.MAILGUN_DOMAIN + '>',
            to: 'miguelmonteiroclaveri@gmail.com',
            subject: 'Recuperacion de contraseña',
            template: "recover_password",
            'h:X-Mailgun-Variables': JSON.stringify({
                linkButton: linkReset
            })
        };
        const response = await mailer.messages().send(mensaje);
        console.log(response);
        res.status(OK);
        return res.end();
    }


    @Put('recover/password')
    private async asignNewPassword(req: Request, res: Response) {
        const tokenValidacion = req.body.tokenValidacion;
        const password1 = req.body.contraseña1;
        const password2 = req.body.contraseña2;
        if (this.tokenService.validateToken(tokenValidacion)) {
            const email = this.tokenService.getEmail(tokenValidacion);

            const usuario = <any>this.usuarioService.findByEmail(email);
            if (usuario === null) {
                res.status(BAD_REQUEST).statusMessage = "El usuario del token ya no existe en la BBDD";
                return res.end();
            }

            const userToModify = usuario.dataValues;

            /*
            * TODO VALIDAMOS LAS PASSWORDS
            * */


            userToModify.contraseña = password1;
            await this.usuarioService.update(userToModify, true);

            res.status(OK);
            return res.end();
        }
        res.status(BAD_REQUEST).statusMessage = "Token no valido";
        return res.end();
    }



}
