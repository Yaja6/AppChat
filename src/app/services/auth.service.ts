import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { UserInterface } from '../models/user.interface';

import { AngularFirestore, AngularFirestoreDocument, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import firebase from 'firebase';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public user: Observable<UserInterface>;

  constructor(public fireAuth: AngularFireAuth, private fireStore: AngularFirestore){
    this.getUid();
  }

  async register(email: string, password: string){
    try{
      await this.fireAuth.createUserWithEmailAndPassword(email, password);
    }catch (error){
      console.log(error);
    }
  }

  async loginUser(email: string, password: string){
    try{
      const {user} = await this.fireAuth.signInWithEmailAndPassword(email, password);
      return user;
    }catch (error){
      console.log(error);
    }
  }

  async getUid(){ // retorna identificador de user
    const uidUser = await this.fireAuth.currentUser;
    if (uidUser === null){
      return null;
    }else{
      return uidUser.uid;
    }
  }

  userDetails() {
    return this.fireAuth.user;
  }
  logout(){
    this.fireAuth.signOut();
  }
  stateAuth(){ // estado de autenticacion
  return this.fireAuth.authState;
  }
  getAuth(){
  return this.fireAuth.authState.pipe(map(auth => auth));
  }


}

