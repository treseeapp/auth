import {Column, DataType, Model, Table} from 'sequelize-typescript';

@Table({
    tableName: "usuario",
    createdAt: false,
    updatedAt: false,
})
export class Usuario extends Model<Usuario> {

    @Column({
        field: 'idusuario',
        primaryKey: true,
        type: DataType.NUMBER
    })
    idusuario: number | undefined;

    @Column({
        field: 'email',
        type: 'string'
    })
    email: string | undefined;

    @Column({
        field: 'contraseña',
        type: 'string'
    })
    contraseña: string | undefined;

    @Column({
        field: 'nombre',
        type: 'string'

    })
    nombre: string | undefined;

    @Column({
        field: 'apellidos',
        type: 'string'

    })
    apellidos: string | undefined;

    @Column({
        field: 'direccion',
        type: 'string'

    })
    direccion: string | undefined;

    @Column({
        field: 'genero',
        type: 'string'

    })
    genero: string | undefined;

    @Column({
        field: 'dataNacimiento',
        type: 'string'

    })
    dataNacimiento: string | undefined;

    @Column({
        field: 'rol',
        type: 'string'

    })
    rol: string | undefined;

    @Column({
        field: 'modo_inicio_sesion',
        type: DataType.NUMBER
    })
    modo_inicio_sesion: number | undefined;
}