import {OK, UNAUTHORIZED} from 'http-status-codes';
import {Controller, Get, Middleware, Post} from '@overnightjs/core';
import {Request, Response} from 'express';
import {UsuarioService} from "../service/UsuarioService";
import * as passport from "passport";
import {TokenService} from "../service/TokenService";
import {ModoInicioSesion} from "../model/enum/ModoInicioSesion";
import {Rol} from "../model/enum/Rol";
import {Genero} from "../model/enum/Genero";

require('../config/enviroment');
require('../config/passport');

@Controller('auth/')
export class LoginController {

    private usuarioService: UsuarioService;
    private tokenService: TokenService;

    constructor() {
        this.usuarioService = new UsuarioService();
        this.tokenService = new TokenService();
    }

    @Get('google')
    @Middleware(passport.authenticate('google', {scope: ['profile', 'email', 'https://www.googleapis.com/auth/user.addresses.read','https://www.googleapis.com/auth/user.birthday.read']}))
    private loginGoogle(req: Request, res: Response) {
        res.end();
    }


    @Get('google/callback')
    @Middleware(passport.authenticate('google', {
        failureRedirect: '/auth/google/failure'
    }))
    private loginGoogleCallBack(req: Request, res: Response) {
        const usuario = <any>req.user;

        const accessToken = this.tokenService.tokenGenerator(usuario);
        const refreshToken = this.tokenService.tokenGenerator(usuario, process.env.REFRESH_TOKEN_EXPIRE);
        const rol = Rol[usuario.rol];

        // Habrá que modificar la ruta si es otra más adelante
        res.redirect(301, process.env.FRONTEND_URL + '/?accessToken=' + accessToken + '&refreshToken=' + refreshToken + '&rol=' + rol + '#/login/callback');
    }

    @Get('google/failure')
    private loginGoogleCallBackFailure(req: Request, res: Response) {
        res.redirect(301, process.env.FRONTEND_URL + '/#/login/');
    }


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
                    res.status(UNAUTHORIZED).statusMessage = 'Datos de login no validos';
                    return res.end()
                }

                /*
                * Creamos los dos tokens que necesitara el usuario
                *
                * La passwd nucna va al token, por eso en el token generator la quitamos
                * */
                const token = this.tokenService.tokenGenerator(usuario.dataValues);
                const refresh_token = this.tokenService.tokenGenerator(usuario.dataValues, process.env.REFRESH_TOKEN_EXPIRE);
                const rol = Rol[usuario.rol];

                return res.status(OK).json({
                    access_token: token,
                    refresh_token: refresh_token,
                    rol: rol
                })

            })(req, res);
    }

    @Post('register')
    private async registerUser(req: Request, res: Response) {

        /*
        * Comprovamos que el usuario ya no exista
        * Si existe, mandamos un 400 + mensaje 'email ya existe en la ddbb'
        * */
        const email = req.body.email;
        const result = <any>await this.usuarioService.findByEmail(email);

        if (result!==null){
            // AQUI VA EL ERROR  (BORRAR COMENT)
        }

        /*
        * TODO
        *  Comprobar que recibimos campos obligatorios
        *   Si no se reciben, enviar error 400 + Mensaje
        * */




        /*
        * TODO Mirar que genero recibimos
        *  Seleccionarlo con nuestro enum
        * */
        const genero = Genero.INDEFINIDO; // MODIFICAR   (BORRAR)

        /*
        * Creamos el usuario
        * */
        await this.usuarioService.createUser({
            email: req.body.email,
            contraseña: req.body.contraseña,
            nombre: req.body.nombre,
            apellidos: req.body.apellidos,
            direccion: req.body.direccion,
            genero: genero,
            dataNacimiento: req.body.dataNacimiento,
            rol: Rol.ESTUDIANTE,
            modo_inicio_sesion: ModoInicioSesion.LOCAL,
            foto_perfil: ''
        });

        return res.status(OK).statusMessage = "Usuario creado"
    }

    @Post('/auth/refresh/token')
    private async refreshToken(req: Request, res: Response) {



        /*
        * Primer paso ! Validamos refresh token
        *
        * 401  + mensaje
        * */


        /*
        * Cogemos email token refresh
        *
        * si token no tiene email
        * 400 + mensaje oye no tienes email en el token
        * */


        /*
        * Validar que existe usuario con ese email
        *
        * 400 + mensaje
        * */

        /*
        * Creamos los 2 tokens
        * */


        /*
        * Enviamos el response al cliente
        * */
        res.json({
            accessToken:'',
            refreshToken: ''
        })
    }

}
