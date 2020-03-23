import * as jwt from "jsonwebtoken";

export class TokenService {
    tokenGenerator(user: any, expiresTime: any = process.env.ACCES_TOKEN_EXPIRE) {
        // Quitamos la password del usuario ya que nunca deberia haber informacion delicada en el token
        user.contraseña = '';
        const stringUser: string = <string><unknown>user;
        return jwt.sign(stringUser, process.env.JWT_SECRET || '', {
            expiresIn: expiresTime,
            subject: user.idusuario + ""// CAST TO STRING
        });
    }

    validateToken(refreshToken: any) {

        try {

            console.log("Validamos el token");

            jwt.verify(refreshToken, <string>process.env.TOKEN_SECRET_KEY);

            console.log("El token valida");

            return true;

        } catch (e) {
            console.log("El token no es válido");
            return false;
        }
    }

    getUser(refreshToken: any) {

        let decoded: any = jwt.verify(refreshToken, <string>process.env.TOKEN_SECRET_KEY);

        console.log(decoded.user);
        return decoded.user;

    }
}