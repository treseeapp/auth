import {BAD_REQUEST, OK, UNAUTHORIZED} from 'http-status-codes';
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
    @Middleware(passport.authenticate('google', {scope: ['profile', 'email', 'https://www.googleapis.com/auth/user.addresses.read', 'https://www.googleapis.com/auth/user.birthday.read']}))
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
                    return res.end();
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
                    accessToken: token,
                    refreshToken: refresh_token,
                    rol: rol
                })

            })(req, res);
    }

    @Post('register')
    private async registerUser(req: Request, res: Response) {

        /*
        * Comprovamos que el usuario ya no exista
        * Si existe, mandamos un 400 + mensaje 'Este correo ya existe'
        * */
        const email = req.body.email;
        const contraseña = req.body.contraseña;
        const nombre = req.body.nombre;
        const apellidos = req.body.apellidos;
        const dataNacimiento = req.body.dataNacimiento;

        const result = <any>await this.usuarioService.findByEmail(email);
        if (result !== null) {
            res.status(BAD_REQUEST).statusMessage = 'Email ya en uso';
            return res.end();
        }

        /*
        * Miramos que recibimos los campos obligtorios desde el cliente
        * */
        if (email !== "" && email !== null && email !== undefined &&
            contraseña !== "" && contraseña !== null && contraseña !== undefined &&
            nombre !== "" && nombre !== null && nombre !== undefined &&
            apellidos !== "" && apellidos !== null && apellidos !== undefined) {

            let genero = null;
            if (req.body.genero == "Hombre") genero = Genero.HOMBRE;
            if (req.body.genero == "Mujer") genero = Genero.MUJER;

            let direccion = null;
            if (req.body.direccion != '') direccion = req.body.direccion;

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

            return res.status(OK).end();
        } else {
            console.log("Hay cambios que faltan");
            res.status(BAD_REQUEST).statusMessage = "Faltan datos requeridos del usuario";
            return res.end();
        }
    }

    @Post('refresh/token')
    private async newToken(req: Request, res: Response) {

        // TODO COMPROBAR QUE FUNCIONA CUANDO PODAMOS HACER PETICIONES

        const refreshToken = <string>req.header("Authorization");
        if (!refreshToken && refreshToken === '') {
            res.status(BAD_REQUEST).statusMessage = "Refresh token no recibido";
            return res.end();
        }

        /*
        * Primer paso ! Validamos refresh token
        *
        * 401  + mensaje
        * */

        const validate = this.tokenService.validateToken(refreshToken);

        if (validate == false) {
            res.status(UNAUTHORIZED).statusMessage = "TOKEN NO VALIDO";
            return res.end();
        }

        const usuario = this.tokenService.getUser(refreshToken);

        const newAccesToken = this.tokenService.tokenGenerator(usuario);
        const newRefreshToken = this.tokenService.tokenGenerator(usuario, process.env.REFRESH_TOKEN_EXPIRE);

        /*
        * Enviamos el response al cliente
        * */
        res.status(OK).json({
            accessToken: newAccesToken,
            refreshToken: newRefreshToken
        });
    }
}
