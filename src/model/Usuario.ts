import {Column, DataType, Model, Table} from 'sequelize-typescript';

/*
* En este caso no mapeamos todos los campos,
* ya que aqui en nodeJS solo necesitamos
* los campos necesarios para el inicio
* de sesion de nuestros usuarios
* */
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


    /*Como hibernate, mapeamos un numero que hara
    referencia a la posicion de un enum, que seran
    los tipos de login que tenemos*/
    @Column({
        field: 'modo_inicio_sesion',
        type: DataType.NUMBER
    })
    modo_inicio_sesion: number | undefined;
}