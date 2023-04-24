from flask import Flask, render_template, request, session
import json
import pyodbc
import binascii
from datetime import datetime as dt
import locale

app = Flask(__name__)

locale.setlocale(locale.LC_ALL, 'es_ES.UTF-8')

connection = pyodbc.connect(
    'DRIVER={ODBC Driver 17 for SQL Server};SERVER=localhost\sqlexpress;DATABASE=FC;UID=SYSDBA;PWD=masterkey;Trusted_Connection=yes;MARS_Connection=Yes;')
connection.timeout = 3
connection.autocommit = True

# Utils
def ConvertDate(date):
    fechaCon = {
        "ene": "enero", "feb": "febrero", "mar": "marzo", "abr": "abril", "may": "mayo", "jun": "junio", "jul": "julio", "ago": "agosto", "sep": "septiembre", "oct": "octubre", "nov": "noviembre", "dic": "diciembre"}
    return dt.strptime(date.replace(date.split('-')[1], fechaCon[date.split('-')[1]]), "%d-%B-%Y")

def ConvertDateNoDay(date):
    fechaCon = {
        "ene": "enero", "feb": "febrero", "mar": "marzo", "abr": "abril", "may": "mayo", "jun": "junio", "jul": "julio", "ago": "agosto", "sep": "septiembre", "oct": "octubre", "nov": "noviembre", "dic": "diciembre"}
    return dt.strptime(date.replace(date.split(' ')[0], fechaCon[date.lower().split(' ')[0]]), "%B %Y")

@app.route("/addUser", methods=["POST"])
def addUser():
    session = {}
    if request.method == 'POST':
        req = request.get_json()
        # print(req)
        session['data'] = req
        if 'data' in session:
            # print("usuarios...")
            encUsuario = str.encode(req["usuario"])
            hexUsuario = binascii.b2a_hex(encUsuario)
            usuario = str(str(hexUsuario)[1:]).replace('\'', '')
            cursor = connection.cursor()
            query = f"""UPDATE usuarios SET mensajes = {req["mensajes"]}, registro = '{ConvertDate(req["registro"])}', hilos = {req["hilos"]}, updated = '{dt.today().strftime('%Y-%m-%d %H:%M:%S')}' where id= {req["id"]}
                    IF @@ROWCOUNT=0
                    INSERT INTO usuarios (id, usuario, mensajes, hilos, registro, updated) 
                        VALUES ({req["id"]}, '{usuario}', {req["mensajes"]}, {req["hilos"]}, '{ConvertDate(req["registro"])}', '{dt.today().strftime('%Y-%m-%d %H:%M:%S')}')"""
            try:
                cursor.execute(query)
                cursor.close()
                return json.dumps({'success': True}), 200, {'ContentType': 'application/json'}
            except Exception as e:
                cursor.close()
                print(e)
                return json.dumps({'success': False}), 400, {'ContentType': 'application/json'}
        else:
            return json.dumps({'success': False}), 500, {'ContentType': 'application/json'}

@app.route("/addUsers", methods=["POST"])
def addUsers():
    session = {}
    if request.method == 'POST':
        req = request.get_json()
        # print(req)
        session['data'] = req
        # print("usuarios...")
        if 'data' in session:
            for usuario in req:
                encUsuario = str.encode(usuario["usuario"])
                hexUsuario = binascii.b2a_hex(encUsuario)
                hexUsuarioStr = str(str(hexUsuario)[1:]).replace('\'', '')
                cursor = connection.cursor()

                try:
                    query = f"""UPDATE usuarios SET mensajes = {usuario["mensajes"]}, updated = '{dt.today().strftime('%Y-%m-%d %H:%M:%S')}' where id= {usuario["id"]}
                        IF @@ROWCOUNT=0
                        INSERT INTO usuarios (id, usuario, mensajes, registro, updated) 
                            VALUES ({usuario["id"]}, '{hexUsuarioStr}', {usuario["mensajes"]}, '{ConvertDateNoDay(usuario["registro"])}', '{dt.today().strftime('%Y-%m-%d %H:%M:%S')}')"""
                    cursor.execute(query)
                    cursor.close()
                except Exception as e:
                    cursor.close()
                    print(e)
                    return json.dumps({'success': False}), 400, {'ContentType': 'application/json'}
            return json.dumps({'success': True}), 200, {'ContentType': 'application/json'}
        else:
            return json.dumps({'success': False}), 500, {'ContentType': 'application/json'}

@app.route("/getAllUsers", methods=["GET"])
def getAllUsers():
    try:
        cursor = connection.cursor()
        query = "SELECT stat from estadisticas where id = 'max_mensajes'"
        cursor.execute(query)
        max_mensajes = cursor.fetchone()[0]
        query = f"""SELECT 
                    COALESCE(CAST(CAST(mensajes + COALESCE(hilos, 1) * 10 AS FLOAT) / {max_mensajes} * 1000000 AS DECIMAL (10,2)), 0) as puntos, usuario, mensajes, hilos, id, registro,
                    DATEDIFF(day, registro, GETDATE()) dias_antiguedad, mensajes * 1.0/NULLIF(DATEDIFF(day, registro, GETDATE()), 0) mensajes_dia, 
                    hilos * 1.0/NULLIF(DATEDIFF(day, registro, GETDATE()), 0) hilos_dia
                    FROM usuarios
                """
        cursor.execute(query)
        res = cursor.fetchall()
        res.sort(key=lambda tup: tup[0], reverse=True)
        cursor.close()

        res = [dict(zip(["puntos", "usuario", "mensajes", "hilos", "id", "registro", "dias_antiguedad", "mensajes_dia", "hilos_dia"], row))
               for row in res]
        for index in range(len(res)):
            for key in res[index]:
                if key == "usuario":
                    res[index][key] = (bytes.fromhex(
                        res[index][key])).decode("utf-8")

    except Exception as e:
        connection.commit()
        cursor.close()
        print("GetAllUsers: " + e)
        return f"{e}", 400

    return json.dumps(res, default=str), 200, {'ContentType': 'application/json'}

@app.route("/addHilos", methods=["POST"])
def addHilos():
    session = {}
    if request.method == 'POST':
        req = request.get_json()
        #print(req)
        session['data'] = req
        if 'data' in session:
            #print("poles...")
            cursor = connection.cursor()

            query = f'''BEGIN
                            IF NOT EXISTS (SELECT * FROM poles WHERE hilo_id = {req["hilo_id"]})
                                BEGIN
                                    INSERT INTO poles (usuario_id, hilo_id) 
                                    VALUES ({req["usuario_id"]}, {req["hilo_id"]})
                                END
                        END'''
            try:
                cursor.execute(query)
                cursor.close()
                return json.dumps({'success': True}), 200, {'ContentType': 'application/json'}
            except Exception as e:
                cursor.close()
                print(e)
                return json.dumps({'success': False}), 400, {'ContentType': 'application/json'}
        else:
            return json.dumps({'success': False}), 500, {'ContentType': 'application/json'}

@app.route("/addUserHilosOld", methods=["POST"])
def addUserHilosOld():
    session = {}
    if request.method == 'POST':
        req = request.get_json()
        # print(req)
        session['data'] = req
        if 'data' in session:
            # print("usuarios...")
            encUsuario = str.encode(req["usuario"])
            hexUsuario = binascii.b2a_hex(encUsuario)
            usuario = str(str(hexUsuario)[1:]).replace('\'', '')
            cursor = connection.cursor()
            query = f"""UPDATE usuarios SET hilos = {req["hilos"]}, updated = '{dt.today().strftime('%Y-%m-%d %H:%M:%S')}' where usuario= '{usuario}'"""
            try:
                cursor.execute(query)
                cursor.close()
                return json.dumps({'success': True}), 200, {'ContentType': 'application/json'}
            except Exception as e:
                cursor.close()
                print(e)
                return json.dumps({'success': False}), 400, {'ContentType': 'application/json'}
        else:
            return json.dumps({'success': False}), 500, {'ContentType': 'application/json'}


def CalculatePoints(hilos, mensajes, totalMensajes):
    multiplicador = 1
    for i in range(0, len(str(totalMensajes)) - 3):
        multiplicador *= 10
    return ((mensajes + hilos * 10)/totalMensajes)*multiplicador

@app.route('/')
def test():
    return render_template('popup.html')


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)


# Reverse encoding
# (bytes.fromhex(res[index][key])).decode("utf-8")
