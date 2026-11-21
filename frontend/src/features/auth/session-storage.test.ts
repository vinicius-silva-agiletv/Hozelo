import { describe, expect, it } from 'vitest'

import { fakeToken } from '@/test/mock-api'

import { clearSession, decodeTokenExpiry, loadSession, saveSession, updateStoredAccountName } from './session-storage'

describe('session-storage', () => {
  it('"Manter conectado" grava no localStorage; senão no sessionStorage', () => {
    const token = fakeToken()

    saveSession({ accessToken: token, accountName: 'Família' }, true)
    expect(localStorage.getItem('hozelo.session')).not.toBeNull()
    expect(sessionStorage.getItem('hozelo.session')).toBeNull()

    saveSession({ accessToken: token, accountName: 'Família' }, false)
    expect(localStorage.getItem('hozelo.session')).toBeNull()
    expect(loadSession()).toEqual({ accessToken: token, accountName: 'Família' })
  })

  it('descarta sessão expirada ou malformada', () => {
    saveSession({ accessToken: fakeToken(-10), accountName: 'Família' }, true)
    expect(loadSession()).toBeNull()
    expect(localStorage.getItem('hozelo.session')).toBeNull()

    localStorage.setItem('hozelo.session', '{ inválido')
    expect(loadSession()).toBeNull()

    saveSession({ accessToken: 'sem.formato', accountName: 'Família' }, true)
    expect(loadSession()).toBeNull()
  })

  it('lê o exp do token, atualiza o nome e limpa tudo ao sair', () => {
    const token = fakeToken(60)
    expect(decodeTokenExpiry(token)).toBeGreaterThan(Date.now() / 1000)

    saveSession({ accessToken: token, accountName: 'Família' }, true)
    updateStoredAccountName('Família Silva')
    expect(loadSession()?.accountName).toBe('Família Silva')

    clearSession()
    expect(loadSession()).toBeNull()
  })
})
