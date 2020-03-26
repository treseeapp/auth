import {BAD_REQUEST, OK, UNAUTHORIZED} from 'http-status-codes';
import {Controller, Put} from '@overnightjs/core';
import {Request, Response} from 'express';
import {UsuarioService} from "../service/UsuarioService";
import {TokenService} from "../service/TokenService";
import * as encriptador from "bcrypt";
import {ModoInicioSesion} from "../model/enum/ModoInicioSesion";

require('../config/enviroment');

@Controller('usuario/')
export class UsuarioController {
    /*
* Variables genericas para toda la clase
* */
    private usuarioService: UsuarioService;
    private tokenService: TokenService;

    constructor() {
        this.usuarioService = new UsuarioService();
        this.tokenService = new TokenService();
    }

    @Put('seguridad')
    private async modifySecurity(req: Request, res: Response) {

        /*
        * Primero de tod_o validamos el token para asegurarnos de que esta autorizado
        * */
        const token = <string>req.header("Authorization");
        const validate = this.tokenService.validateToken(token);
        if (!validate) {
            res.status(UNAUTHORIZED).statusMessage = "No estas autorizado para realizar esta accion";
            return res.end();
        }
        /*
        * Validamos que las nuevas contraseñas coincidan
        * */
        const passwords = req.body;
        if (passwords.newPassword !== passwords.newPassword1) {
            res.status(BAD_REQUEST).statusMessage = 'Las dos contraseñas no coinciden';
            return res.end();
        }

        /*
        * Validamos que la contraseña cumpla los requisitos establecidos
        * */
        if (!/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,20}$/.test(passwords.newPassword)) {
            res.status(BAD_REQUEST).statusMessage = "La nueva contraseña no cumple los requisitos mínimos.";
            return res.end();
        }


        const email = this.tokenService.getEmail(token);
        let usuario = <any>await this.usuarioService.findByEmail(email);
        usuario = usuario.dataValues;

        /*
        * No dejamos cambiar la passwd a un usuario el cual es de oatuh !!!!
        * */
        if (usuario.modo_inicio_sesion !== ModoInicioSesion.LOCAL) {
            res.status(BAD_REQUEST).statusMessage = 'Los usuarios que no son locales no pueden modificar su contraseña';
            return res.end();
        }

        const validacionPassword = await encriptador.compare(passwords.oldPassword, usuario.contraseña);
        /*
        * Aqui podria decir que la contraseña antigua
        * no coincide con la que tiene el usuario
        * pero estaria dando demasiada informacion al cliente
        * */
        if (!validacionPassword) {
            res.status(BAD_REQUEST).statusMessage = "No se ha podido cambiar tu contraseña";
            return res.end();
        }
        usuario.contraseña = passwords.newPassword;

        await this.usuarioService.update(usuario, true);

        res.status(OK).end();
    }
}