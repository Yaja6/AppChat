# AppChat
- Descripción: Aplicación de Chat con Firebase como base de datos.
- Link Video explicativo: https://youtu.be/Shh9WYFxceQ

Descripción de las principales funciones usadas.
*el apk está dentro de la carpeta android del proyecto*
## Interfaces creadas: userInterface y messageInterface dentro de la carpeta **models**

**user.interface.ts**
```
export interface UserInterface{
    uid: string;
    email: string;
    name?: string;
    photo?: string;
    password: string;
    emailVerified: boolean;
}
```
**msg.interface.ts**
```
export interface MessageInterface{
    id: string;
    idUserTo: string;
    idUserFrom: string;
    text: string;
    img?: string;
    textDes: string;
    uPhoto?: string;
    uName?: string;
    date?: Date;
    hour?: string;
}

```

## Servicios creados para manejar la base de datos Firebase

_Se manejarán los servicios: Storage, Cloud Store y Authentication_

### auth.service.ts

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

### firestore.service.ts

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

### firestorage.service.ts

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

## Register

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

## Home

_Se muestran los usuarios registrados para poder iniciar un chat._

Dentro de **home.component.ts**

users: UserInterface[] = []; -> declaro un arreglo de usuarios de tipo UserInterface

Para tomar el id del usuario actual y como el controlador es el primero en ejecutarse, dentro de este se tomará el estado de autenticación del usuario

```
this.authSvc.stateAuth().subscribe(res => {
      console.log(res);
      if (res != null){
        this.idCurrentUser = res.uid;
        this.getUserInfo(this.idCurrentUser);
        console.log('id ini', this.idCurrentUser);
      }else{
        this.initUser();
      }
    });
```
**getUsers()**: Toma los usuarios registrados de la base de datos los envía a un arreglo de tipo UserInterface. Usa el método getCollection desde el servicio firestore para tomar los datos guardados

```
 getUsers(){
    this.firestoreService.getCollection<UserInterface>(this.path).subscribe( res => {  // res - respuesta del observador
    this.users = res; //envío los datos del firestore hacia el arreglo
    console.log('Users', res);
   });
  }
```

**getUserInfo()**: Toma los datos de la base de datos dada una id

```
 getUserInfo(uid: string){ // trae info de la bd
    const path = 'Users/';
    this.firestoreService.getDoc<UserInterface>(path, uid).subscribe( res => {
      this.user = res;
    });
  }
```
**modalMessage()**: Abrirá el modal para iniciar un chat 

```
  async modalMessage(id: string) {
    const modal = await this.modalController.create({
      component: ChatPage,
      componentProps: {
        idUser: id
      }
    });
    return await modal.present();
  }
```

## Modal: Chat

_En el componente html se mostrará un chat y los mensajes del usuario con otro_

Dentro de **chat.page.ts**

Se declara una variable de tipo MessageInterface que guardará los atributos del mensaje: Tendrá un id de usuario que envía y el que recibe el mensaje, el texto encriptado y el texto desencriptado (principales)

```
msg: MessageInterface = {
    id: '',
    idUserTo: '',
    idUserFrom: '',
    text: '',
    img: '',
    uName: '',
    uPhoto: '',
    date: new Date(),
    hour: '',
    textDes: ''
  };
```

Además se declaran dos variables del tipo UserInterface para poder tomar los datos (id) del usuario actual (quién envía el mensaje -> userFrom) y del usuario a quien va dirigido el mensaje (userTo).

```
  userFrom: UserInterface = {
    uid: '',
    name: '',
    email: '',
    photo: '',
    password: '',
    emailVerified: false,
  };
  userTo: UserInterface = {
    uid: '',
    name: '',
    email: '',
    photo: '',
    password: '',
    emailVerified: false,
  };
```
A continuación se declara un arreglo de mensajes igual donde se almacenarán los mensajes tomados desde la base de datos.

messages: MessageInterface[] = [];

**saveMessage()**: Creará un nuevo documento dentro del path 'Messages/' donde tomará los datos del mensaje traídos desde el componente html. Una vez aquí, el texto se encripta con CryptoJS instalado previamente en el proyecto. Este texto encriptado se guarda como atributo del mensaje y luego se lo desencripta con CryptoJS y se lo guarda en **textDes** que también va a la variable **msg**. Además toma la imagen cargada en caso de que el usuario lo haga.

```
  async saveMessage(){
    const path = 'Messages/';
    const name = this.msg.id;
    this.msg.id = this.firestoreService.getId();
    this.msg.uName = this.uName;
    this.msg.uPhoto = this.uPhoto;
    this.msg.idUserTo = this.idUser;
    this.msg.idUserFrom = this.idCurrentUser;
    this.msg.text = CryptoJS.AES.encrypt(this.textToEncrypt.trim(), this.passEncrypt.trim()).toString();
    this.msg.textDes = CryptoJS.AES.decrypt(this.msg.text.trim(), this.passEncrypt.trim()).toString(CryptoJS.enc.Utf8);
    if (this.newFile !== undefined){
      this.presentLoading();
      const res = await this.fireStorageService.uploadImage(this.newFile, path, name);
      this.msg.img = res;
    }
    this.firestoreService.createDoc(this.msg, path, this.msg.id).then(res => {
      this.textToEncrypt = '';
      this.msg.img = '';
      this.mostrar = false;
      console.log('Mensaje enviado!');
    }).catch (err => {
      console.log(err);
    });
  }
```
**getCurrentUserInfo()**: Traerá la información del usuario actual, lo más importante es su ID que toma desde el momento que se inicia el contructor para añadir al mensaje que se va a enviar y guardarlo como **idUserFrom**.

```
  getCurrentUserInfo(uid: string){ // trae info de la bd
    const path = 'Users/';
    this.firestoreService.getDoc<UserInterface>(path, uid).subscribe( res => {
      this.userFrom = res;
      this.uName = this.userFrom.name;
      this.uPhoto = this.userFrom.photo;
    });
  }
```
**getUserInfo()**: Traerá la información del usuario al que se le va a enviar el mensaje, para esto se usa la ID que recibe el modal cada vez que el usuario abre el modal de un usuario de la lista del home, así se añade al mensaje el atributo **idUserTo**.

```
  getCurrentUserInfo(uid: string){ // trae info de la bd
    const path = 'Users/';
    this.firestoreService.getDoc<UserInterface>(path, uid).subscribe( res => {
      this.userFrom = res;
      this.uName = this.userFrom.name;
      this.uPhoto = this.userFrom.photo;
    });
  }
```
**getmsgs()**: Traerá todos los mensajes de la base de datos y se los pasa a la variable messages[]

```
  getmsgs(){
    const as = this.firestoreService.getCollection<MessageInterface>(this.path).subscribe( res => {  // res - respuesta del observador
    this.messages = res;
    });
  }
```
**formatAMPM()**: Convierte la hora guardada dentro de firebase con formato -> timestamp a hh:mm 

```
  formatAMPM() {
    const  hours = this.msg.date.getHours();
    const minutes = this.msg.date.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';
    const strTime = hours + ':' + minutes + ' ' + ampm;
    this.msg.hour = strTime;
  }
```
**newMessageImage()**: Toma un evento del componente html y carga la imagen hacia el atributo **img** de **msg**

```
  newMessageImage(event: any){
    if (event.target.files && event.target.files[0]){
      this.newFile = event.target.files[0];
      const reader = new FileReader();
      reader.onload = ((image) => {
        this.msg.img = image.target.result as string;
      });
      reader.readAsDataURL(event.target.files[0]);

    }
  }
```

