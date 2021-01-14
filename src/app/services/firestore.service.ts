import { UserInterface } from './../models/user.interface';
import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {

  constructor(public database: AngularFirestore) { }
  createDoc(data: any, path: string, id: string){ // path: ruta de base de datos id: id de documento
    const collection = this.database.collection(path);
    return collection.doc(id).set(data);
  }

  getDoc<tipo>(path: string, id: string){ // tipo es una variable cualquier auqe entra como argumento
    const collection = this.database.collection<tipo>(path);
    return collection.doc(id).valueChanges();
  }

  deleteDoc(path: string, id: string){
    const collection = this.database.collection(path);
    return collection.doc(id).delete();
  }

  updateDoc(data: any, path: string, id: string){
    const collection = this.database.collection(path);
    return collection.doc(id).update(data);
  }
  getId(){
    return this.database.createId();
  }
  getCollection<tipo>(path: string){
    const collection = this.database.collection<tipo>(path); // observador de la bd del tipo -> tipo
    console.log('collecc', collection);
    return collection.valueChanges();

  }
}
