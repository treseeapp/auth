import {UsuarioRepository} from "../repository/UsuarioRepository";
import * as encriptador from "bcrypt";
import {ModoInicioSesion} from "../model/enum/ModoInicioSesion";

require('../config/enviroment');

export class UsuarioService {
    private repo: UsuarioRepository;

    constructor() {
        this.repo = new UsuarioRepository();
    }

    async findByEmail(email: string) {
        return await this.repo.findByEmail(email);
    }

    async validateUserLocal(usuarioToCheck: any) {
        let user = await this.repo.findByEmail(usuarioToCheck.email);
        if (user === null || !user) return false;
        user = user.dataValues;
        const validacionPassword = await encriptador.compare(usuarioToCheck.contraseña, user.contraseña);
        return validacionPassword && user.modo_inicio_sesion === ModoInicioSesion.LOCAL;
    }

    async createUser(usuario: any) {
        /*
        * Antes de añadirlo, la password la cifraremos
        *
        * */
        const password = usuario.contraseña;
        const saltRounds = 10;

        usuario.contraseña = await encriptador.hash(password, saltRounds);
        await this.repo.create(usuario);
    }

    /*
    * Este booleano lo que significa es que se ha
    * modificado la password y antes de hacer el update hay que encriptarla
    * */
    async update(usuario: any, encryptPass: boolean = false) {
        if (encryptPass) {
            const password = usuario.contraseña;
            const saltRounds = 10;

            usuario.contraseña = await encriptador.hash(password, saltRounds);
        }

        await this.repo.update(usuario)
    }
}