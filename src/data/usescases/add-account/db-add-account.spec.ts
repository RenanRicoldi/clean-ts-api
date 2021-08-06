import { DbAddAccount } from './db-add-account'
import { AccountModel, AddAccountModel, AddAccountRepository, Encrypter } from './db-add-account-protocols'

const makeEncrypter = (): Encrypter => {
  class EncrypterStub implements Encrypter {
    async encrypt (value: string): Promise<string> {
      return await new Promise(resolve => resolve('hashed_password'))
    }
  }

  return new EncrypterStub()
}

const makeAddAccountRepository = (): AddAccountRepository => {
  class AddAccountRepositoryStub implements AddAccountRepository {
    async add (account: AddAccountModel): Promise<AccountModel> {
      const fakeAccount = {
        name: 'valid_name',
        email: 'valid_email',
        password: 'hashed_password',
        id: 'valid_id'
      }

      return await new Promise(resolve => resolve(fakeAccount))
    }
  }

  return new AddAccountRepositoryStub()
}

interface SutTypes {
  sut: DbAddAccount
  encrypterStub: Encrypter
  addAccountRepositoryStub: AddAccountRepository
}

const makeSut = (): SutTypes => {
  const encrypterStub = makeEncrypter()
  const addAccountRepositoryStub = makeAddAccountRepository()
  const sut = new DbAddAccount(encrypterStub, addAccountRepositoryStub)

  return {
    sut,
    encrypterStub,
    addAccountRepositoryStub
  }
}

describe('DbAccount UseCase', () => {
  test('Should call Encrypter with correct password', async () => {
    const { encrypterStub, sut } = makeSut()
    const encryptSpy = jest.spyOn(encrypterStub, 'encrypt')

    const accountData = {
      name: 'valid_name',
      email: 'valid_email',
      password: 'valid_password'
    }

    await sut.add(accountData)
    expect(encryptSpy).toHaveBeenCalledWith('valid_password')
  })

  test('Should throw if Encrypter throws', async () => {
    const { encrypterStub, sut } = makeSut()
    jest
      .spyOn(encrypterStub, 'encrypt')
      .mockReturnValueOnce(
        new Promise(
          (resolve, reject) => reject(new Error())
        )
      )

    const accountData = {
      name: 'valid_name',
      email: 'valid_email',
      password: 'valid_password'
    }

    const promiseSut = sut.add(accountData)
    await expect(promiseSut).rejects.toThrow()
  })

  test('Should call AddAccountRepository with correct values', async () => {
    const { addAccountRepositoryStub, sut } = makeSut()
    const addSpy = jest.spyOn(addAccountRepositoryStub, 'add')

    const accountData = {
      name: 'valid_name',
      email: 'valid_email',
      password: 'valid_password'
    }

    await sut.add(accountData)
    expect(addSpy).toHaveBeenCalledWith({
      ...accountData,
      password: 'hashed_password'
    })
  })
})
