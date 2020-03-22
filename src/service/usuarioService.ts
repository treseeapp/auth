import {UsuarioRepository} from "../repository/usuarioRepository";
import * as encriptador from "bcrypt";

export class UsuarioService {
    private repo: UsuarioRepository;

    constructor() {
        this.repo = new UsuarioRepository();
    }

    async findAllUsers() {
        return this.repo.findAll();
    }

    async findByEmail(email: string) {
        return await this.repo.findByEmail(email);
    }

    async validateUser(usuario:any){

        // Esto es lo mismo que el método findByEmail
        // Lo comentamos
        return await this.repo.findByEmail(usuario.email);

    }

    async createUser(usuario: any) {

        const password = usuario.contraseña;
        const saltRounds = 10;

        if (password){
            console.log("Encripta el password");
            usuario.contraseña = await encriptador.hash(password, saltRounds);
        }

        await this.repo.create(usuario);

    }
}