import dataStore from 'nedb-promise';

export class AssignmentRepo{
    constructor({filename, autoload}){
        this.repo=dataStore({filename, autoload});
    }

    async find(props){
        return this.repo.find(props);
    }

    async findOne(props){
        return this.repo.findOne(props);
    }

    async insert(assignment){
        if(!assignment){
            throw new Error("Content property is missing!");
        }
        return this.repo.insert(assignment);
    };

    async update(props, assignment){
        return this.repo.update(props, assignment);
    }

    async remove(props){
        return this.repo.delete(props);
    }
}

export default new AssignmentRepo({filename: 'D:\\Faculta\\AnIII_sem.1\\Mobile\\Laborator\\Lab_app\\server\\database\\assignments.json', autoload:true});