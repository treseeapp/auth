import {sequelize} from "../config/sequelize";
import {Usuario} from "../model/Usuario";

export class UsuarioRepository {

    private repo: any;

    constructor() {
        this.repo = sequelize.getRepository(Usuario);
    }

    async findAll() {
        return this.repo.findAll();
    }

    async findByEmail(email: string) {
        const usuario = await this.repo.findOne({
            where: {
                email: email
            }
        });
        return usuario;
    }

    async create(usuario: any) {
        const lucas = await this.repo.create(usuario);
    }

    async update(usuario: any) {
        return this.repo.update(usuario, {
            where: {
                email: usuario.email
            }
        });
    }
}