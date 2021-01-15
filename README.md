# AppChat
- Descripción: Aplicación de Chat con Firebase como base de datos.
- Link Video explicativo: https://youtu.be/Shh9WYFxceQ

Descripción de las principales funciones usadas.

## Servicios creados para manejar la base de datos Firebase

_Se manejarán los servicios: Storage, Cloud Store y Authentication_

###auth.service.ts

**Registro de usuario con email y contraseña dentro de Firebase**

```
  async register(email: string, password: string){
    try{
      await this.fireAuth.createUserWithEmailAndPassword(email, password);
    }catch (error){
      console.log(error);
    }
  }
```
**Inicio de usuario con email y contraseña dentro de Firebase**

```
  async loginUser(email: string, password: string){
    try{
      const {user} = await this.fireAuth.signInWithEmailAndPassword(email, password);
      return user;
    }catch (error){
      console.log(error);
    }
  }
```
**getUid** retorna el id del usuario actual

```
  async getUid(){ // retorna identificador de user
    const uidUser = await this.fireAuth.currentUser;
    if (uidUser === null){
      return null;
    }else{
      return uidUser.uid;
    }
  }
```
**userDetails()** retorna los datos del usuario

```
  async getUid(){ // retorna identificador de user
    const uidUser = await this.fireAuth.currentUser;
    if (uidUser === null){
      return null;
    }else{
      return uidUser.uid;
    }
  }
```
**logout()** desloguea al usuario

```
  logout(){
    this.fireAuth.signOut();
  }
```
**stateAuth()** retorna el estado de autenticación 

```
  stateAuth(){ // estado de autenticacion
  return this.fireAuth.authState;
  }
```

###firestore.service.ts

**createDoc()** permite crear un documento dentro de Firebase, tomando los datos, una ruta donde va a guardarse y el id del documento

```
  createDoc(data: any, path: string, id: string){ // path: ruta de base de datos id: id de documento
    const collection = this.database.collection(path);
    return collection.doc(id).set(data);
  }
```
**getDoc()**: toma un documento en específica con el id y las ruta proporcionada
<tipo> es una variable que entrará como argumento

```
  getDoc<tipo>(path: string, id: string){ // tipo es una variable cualquiera que entra como argumento
    const collection = this.database.collection<tipo>(path);
    return collection.doc(id).valueChanges();
  }
```
**deleteDoc()**: eliminar un documento específico de Firebase 

```
  deleteDoc(path: string, id: string){
    const collection = this.database.collection(path);
    return collection.doc(id).delete();
  }
```
**updateDoc()** actualiza los datos de un documento
```
 updateDoc(data: any, path: string, id: string){
    const collection = this.database.collection(path);
    return collection.doc(id).update(data);
  }
```
**getId()** retorna el Id creado en firebase cada vez que se crea un documento

```
  getId(){
    return this.database.createId();
  }
```
**getCollection()** toma y retorna una colección desde la ruta proporcionada
Se usa un observador para que retorno la colección del tipo <tipo> de la base de datos 

```
  getCollection<tipo>(path: string){
    const collection = this.database.collection<tipo>(path); 
    console.log('collecc', collection);
    return collection.valueChanges();

  }
```

###firestorage.service.ts

**uploadImage()** permite guardar archivos (en este imágenes) dentro del servicio Storage de Firebase. Como parámetros usa una ruta donde se guardarán las imágenes y un nombre del archivo. Además retorna la URL de la imagen guardada.

```
  uploadImage(file: any, path: string, name: string): Promise<string>{
    return new Promise( resolve => {
      const filePath = path + '/' + name;
      const ref =  this.storage.ref(filePath);
      const Task =  ref.put(file);
      Task.snapshotChanges().pipe(
        finalize( () => {
          ref.getDownloadURL().subscribe(res => {
            const downloadUrl = res;
            resolve(downloadUrl);
            return;
          });
        })
      ).subscribe();
    });
  }
```

# Componentes creados:🚀

##Register

_En el componente html se crean campos para que el usuario se registre_

**Dentro de register.page.ts**

Se declara una variable **user** del tipo **UserIterface** que almacena los datos del usuario

**onRegister()**: toma los valores de la variable **user** y usa la función register creada dentro del servicio de autenticación

```
  async onRegister(){
    const credentials = {
      email: this.user.email,
      password: this.user.password
    };
    const res = await this.authSvc.register(credentials.email, credentials.password).catch(err => {
    });
    // const isVerified = this.authSvc.isEmailVerified(this.user);
    const id = await this.authSvc.getUid();
    this.user.uid = id;
    this.saveUser();
    console.log(id);
  }
```
**saveUser()**: Guarda los datos del usuario dentro del servicio Cloud Store. Creará un documento con los datos además de guardar la imagen cargada.

```
  async saveUser() { // registrar usuario en la base de datos con id de auth
    const path = 'Users';
    const name = this.user.name;
    if (this.newFile !== undefined){
      const res = await this.fireStorageService.uploadImage(this.newFile, path, name);
      this.user.photo = res;
    }
    this.firestoreService.createDoc(this.user, path, this.user.uid).then(res => {
      this.presentToast('Registro exitoso!');
      this.redirectUser(true);
    }).catch (err => {
      console.log(err);
      this.presentToast(err.message);
    });
  }
```
**newPhotoProfiler()**: usa un evento para identificar si se va a cargar una imagen y la añade a los datos del usuario cuando se carga.

```
  async newPhotoProfile(event: any){
    if (event.target.files && event.target.files[0]){
      this.newFile = event.target.files[0];
      const reader = new FileReader();
      reader.onload = ((image) => {
        this.user.photo = image.target.result as string;
      });
      reader.readAsDataURL(event.target.files[0]);
    }
  }
```
**onRegisterGoogle()**: registra un usuario con el servicio de autenticación de Google y además lo guarda en la base de datos Cloud Store

```
  async onRegisterGoogle(){
    const path = 'Users';
    try{
      const res = await this.fireAuth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
      const user = res.user;
      if (user){
       // const isVerified = this.authSvc.isEmailVerified(user);
        this.user.name = user.displayName;
        this.user.photo = user.photoURL;
        this.user.email = user.email;
        this.user.uid = user.uid;
        this.firestoreService.createDoc(this.user, path, user.uid).then( res => {
        this.redirectUser(true);
      }).catch (err => {
        console.log(err);
        this.presentToast(err.message);
      });
      }
    } catch (error){
      console.log(error);
    }
  }
```
##Login

_En el componente html se crean campos junto con [(ngModel)] para tomar los valores y pasarlos a la variable user declarada en el componente login.psge.ts para que el usuario inicie sesión_

**Dentro de login.page.ts**

Se declara una variable **user** del tipo **UserIterface** que almacena los datos del usuario

**onLogin()**: toma los valores de la variable **user** y usa la función loginUser creada dentro del servicio **auth** y envía los parámetros _this.user.email_ y _this.user.password_ tomados desde el componente html

```
  async onLogin(){
    try{
      const user = await this.authSvc.loginUser(this.user.email, this.user.password);
      if (user){
        this.redirectUser(true);
      }
    } catch (error){
      console.log(error.errorMessage);
    }
  }
```
**onLoginGoogle()**: inicia un usuario con el servicio de autenticación de Google y además lo guarda en la base de datos Cloud Store

```
  async onLoginGoogle(){
    const path = 'Users';
    try{
      const res = await this.fireAuth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
      const user = res.user;
      if (user){
       // const isVerified = this.authSvc.isEmailVerified(user);
        this.user.name = user.displayName;
        this.user.photo = user.photoURL;
        this.user.email = user.email;
        this.user.uid = user.uid;
        this.firestoreService.createDoc(this.user, path, user.uid).then(res => {
        this.redirectUser(true);
      }).catch (err => {
        console.log(err);
        this.presentToast(err.message);
      });
      }
    } catch (error){
      console.log(error);
    }
  }
```

##Home

_Se muestran los usuarios registrados para poder iniciar un chat._

Dentro de **home.component.ts**

users: UserInterface[] = []; -> declaro un arreglo de usuarios de tipo UserInterface

**getUsers()**: Toma los usuarios registrados de la base de datos los envía a un arreglo de tipo UserInterface. Usa el método getCollection desde el servicio firestore para tomar los datos guardados

```
 getUsers(){
    this.firestoreService.getCollection<UserInterface>(this.path).subscribe( res => {  // res - respuesta del observador
    this.users = res; //envío los datos del firestore hacia el arreglo
    console.log('Users', res);
   });
  }
```




##Login
###Register
###Modal: Chat


Mira **Deployment** para conocer como desplegar el proyecto.


### Pre-requisitos 📋

_Que cosas necesitas para instalar el software y como instalarlas_

```
Da un ejemplo
```

### Instalación 🔧

_Una serie de ejemplos paso a paso que te dice lo que debes ejecutar para tener un entorno de desarrollo ejecutandose_

_Dí cómo será ese paso_

```
Da un ejemplo
```

_Y repite_

```
hasta finalizar
```

_Finaliza con un ejemplo de cómo obtener datos del sistema o como usarlos para una pequeña demo_

## Ejecutando las pruebas ⚙️

_Explica como ejecutar las pruebas automatizadas para este sistema_

### Analice las pruebas end-to-end 🔩

_Explica que verifican estas pruebas y por qué_

```
Da un ejemplo
```

### Y las pruebas de estilo de codificación ⌨️

_Explica que verifican estas pruebas y por qué_

```
Da un ejemplo
```

## Despliegue 📦

_Agrega notas adicionales sobre como hacer deploy_

## Construido con 🛠️

_Menciona las herramientas que utilizaste para crear tu proyecto_

* [Dropwizard](http://www.dropwizard.io/1.0.2/docs/) - El framework web usado
* [Maven](https://maven.apache.org/) - Manejador de dependencias
* [ROME](https://rometools.github.io/rome/) - Usado para generar RSS

## Contribuyendo 🖇️

Por favor lee el [CONTRIBUTING.md](https://gist.github.com/villanuevand/xxxxxx) para detalles de nuestro código de conducta, y el proceso para enviarnos pull requests.

## Wiki 📖

Puedes encontrar mucho más de cómo utilizar este proyecto en nuestra [Wiki](https://github.com/tu/proyecto/wiki)

## Versionado 📌

Usamos [SemVer](http://semver.org/) para el versionado. Para todas las versiones disponibles, mira los [tags en este repositorio](https://github.com/tu/proyecto/tags).

## Autores ✒️

_Menciona a todos aquellos que ayudaron a levantar el proyecto desde sus inicios_

* **Andrés Villanueva** - *Trabajo Inicial* - [villanuevand](https://github.com/villanuevand)
* **Fulanito Detal** - *Documentación* - [fulanitodetal](#fulanito-de-tal)

También puedes mirar la lista de todos los [contribuyentes](https://github.com/your/project/contributors) quíenes han participado en este proyecto. 

## Licencia 📄

Este proyecto está bajo la Licencia (Tu Licencia) - mira el archivo [LICENSE.md](LICENSE.md) para detalles

## Expresiones de Gratitud 🎁

* Comenta a otros sobre este proyecto 📢
* Invita una cerveza 🍺 o un café ☕ a alguien del equipo. 
* Da las gracias públicamente 🤓.
* etc.



---
⌨️ con ❤️ por [Villanuevand](https://github.com/Villanuevand) 😊
