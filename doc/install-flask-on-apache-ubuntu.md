# Bitácora de la instalación y configuración de Apache2, flask, python3 en Ubuntu Server 16.04

Verificar la instalación de  apache2

```
$ dpkg -l | grep apache2
```

clonar kuden en el directorio seleccionado (en este ej. /var/www/kuden)

```
$ cd /var/www/
/var/www/html $ git clone https://github.com/pewen/kuden.git
```

Install Python3 versions of required tools & libraries

```
# apt-get -y install python3 ipython3 python3-flask python3-numpy
```

Install pip3 && Python modules

```
# apt install python3-pip
# pip3 install -U flask-cors
# pip3 install flask-socketio
```

Install Mod_wsgi for running Python3 with Apache

```
# apt-get -y install libapache2-mod-wsgi-py3
```

Ref:  
https://terokarvinen.com/2016/deploy-flask-python3-on-apache2-ubuntu
