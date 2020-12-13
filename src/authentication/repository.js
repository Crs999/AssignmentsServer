import dataStore from 'nedb-promise';

export class UserRepository{
    constructor({filename, autoload}){
        this.repo=dataStore({filename, autoload});
    }

    async findOne(props){
        return this.repo.findOne(props);
    };

    async insert(user){
        return this.repo.insert(user);
    };
}

export default new UserRepository({filename:'D:\\Faculta\\AnIII_sem.1\\Mobile\\Laborator\\AssignmentsApp\\server\\database\\pupils.json', autoload: true});