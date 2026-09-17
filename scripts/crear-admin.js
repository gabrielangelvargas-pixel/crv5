import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { database } from '../src/config/database.js';
import { hashPassword } from '../src/utils/password.js';

function askHidden(question) {
  return new Promise((resolve) => {
    if (!input.isTTY || !input.setRawMode) {
      const fallback = readline.createInterface({ input, output });
      fallback.question(`${question}: `).then((answer) => {
        fallback.close();
        resolve(answer);
      });
      return;
    }

    output.write(`${question}: `);
    let answer = '';
    const onKeypress = (chunk) => {
      const character = chunk.toString();
      if (character === '\u0003') {
        input.setRawMode(false);
        input.pause();
        process.exit(130);
      }
      if (character === '\r' || character === '\n') {
        output.write('\n');
        input.setRawMode(false);
        input.pause();
        input.removeListener('data', onKeypress);
        resolve(answer);
        return;
      }
      if (character === '\u007f') {
        answer = answer.slice(0, -1);
        return;
      }
      if (character >= ' ') answer += character;
    };

    input.resume();
    input.setRawMode(true);
    input.on('data', onKeypress);
  });
}

const prompts = readline.createInterface({ input, output });
let connection;

try {
  const nombre = (await prompts.question('Nombre visible del administrador: ')).trim();
  const usuario = (await prompts.question('Nombre de usuario: ')).trim();
  prompts.close();
  const clave = await askHidden('Clave');
  const confirmacion = await askHidden('Repetir clave');

  if (!nombre || !usuario || !clave || clave !== confirmacion) {
    throw new Error('Los datos son obligatorios y las claves deben coincidir.');
  }

  connection = await database.getConnection();
  await connection.beginTransaction();

  const [roleRows] = await connection.query('SELECT id FROM roles WHERE codigo = ? AND activo = TRUE LIMIT 1', ['admin']);
  if (!roleRows[0]) throw new Error('No existe el rol admin. Aplicá primero las migraciones iniciales.');

  const [userResult] = await connection.query(
    'INSERT INTO usuarios (nombre, usuario, clave_hash, activo) VALUES (?, ?, ?, TRUE)',
    [nombre, usuario, hashPassword(clave)],
  );
  await connection.query(
    'INSERT INTO usuarios_roles (id_usuario, id_rol, activo) VALUES (?, ?, TRUE)',
    [userResult.insertId, roleRows[0].id],
  );

  await connection.commit();
  console.log(`Administrador creado: ${usuario}`);
} catch (error) {
  if (connection) await connection.rollback();
  if (error?.code === 'ER_DUP_ENTRY') {
    console.error('Ese nombre de usuario ya existe. Elegí otro.');
  } else {
    console.error(`No se pudo crear el administrador: ${error.message}`);
  }
  process.exitCode = 1;
} finally {
  if (connection) connection.release();
  await database.end();
}
