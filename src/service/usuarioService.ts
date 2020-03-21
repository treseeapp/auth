import {UsuarioRepository} from "../repository/usuarioRepository";

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


}