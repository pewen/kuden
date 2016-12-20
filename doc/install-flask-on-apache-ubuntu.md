# Bitácora de la instalación y configuración de Apache2, flask, python3 en Ubuntu Server 16.04

Verificar la instalación de  apache2

```
$ dpkg -l | grep apache2
```

clonar kuden en el directorio seleccionado (en este ej. /var/www/kuden)

```
$ cd /var/www/
/var/www $ git clone https://github.com/pewen/kuden.git
```

Install Python3 versions of required tools & libraries

```
# apt-get -y install python3 python3-flask python3-numpy python3-pip
```

Install Python modules from pip3

```
# pip3 install -U flask-cors
# pip3 install -U flask-socketio
```

Install Mod_wsgi for running Python3 with Apache

```
# apt-get -y install libapache2-mod-wsgi-py3
```

Ref:  
http://terokarvinen.com/2016/deploy-flask-python3-on-apache2-ubuntu
