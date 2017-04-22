import * as api from 'src/api/monitorrent'
import store from 'src/store/modules/trackers'
import types from 'src/store/types'
import delay from 'delay'
import { expect } from 'chai'

describe('store/modules/trackers', () => {
    const sandbox = sinon.sandbox.create()

    afterEach(() => {
        sandbox.restore()
    })

    describe('mutations', () => {
        const stateBase = { loading: true, error: null, trackers: [] }

        it('SET_TRACKERS', () => {
            const state = {...stateBase}
            const trackers = [
                {name: 'tracker1.com', form: null},
                {name: 'tracker2.com', form: null}
            ]
            store.mutations[types.SET_TRACKERS](state, trackers)

            expect(state).to.be.eql({ loading: false, error: null, trackers: [...trackers] })
        })

        it('LOAD_TRACKERS_FAILED', () => {
            const trackers = [
                {name: 'tracker1.com', form: null},
                {name: 'tracker2.com', form: null}
            ]
            const state = {...stateBase, trackers}
            const error = Error('Error')
            store.mutations[types.LOAD_TRACKERS_FAILED](state, error)

            expect(state).to.be.eql({ loading: false, error: error, trackers: [] })
        })

        it(`SET_TRACKER_MODEL_0`, () => {
            const trackers = [
                {name: 'tracker1.com', form: null},
                {name: 'tracker2.com', form: null},
                {name: 'tracker3.com', form: null}
            ]
            const state = {trackers}
            const model = {username: 'username', password: 'password'}
            store.mutations[types.SET_TRACKER_MODEL](state, {tracker: 'tracker1.com', model, canCheck: true})

            expect(state).to.be.eql({
                trackers: [
                    {...trackers[0], model, canCheck: true},
                    trackers[1],
                    trackers[2]
                ] })
        })

        it(`SET_TRACKER_MODEL_1`, () => {
            const trackers = [
                {name: 'tracker1.com', form: null},
                {name: 'tracker2.com', form: null},
                {name: 'tracker3.com', form: null}
            ]
            const state = {trackers}
            const model = {username: 'username', password: 'password'}
            store.mutations[types.SET_TRACKER_MODEL](state, {tracker: 'tracker2.com', model, canCheck: true})

            expect(state).to.be.eql({
                trackers: [
                    trackers[0],
                    {...trackers[1], model, canCheck: true},
                    trackers[2]
                ] })
        })

        it(`SET_TRACKER_MODEL_2`, () => {
            const trackers = [
                {name: 'tracker1.com', form: null},
                {name: 'tracker2.com', form: null},
                {name: 'tracker3.com', form: null}
            ]
            const state = {trackers}
            const model = {username: 'username', password: 'password'}
            store.mutations[types.SET_TRACKER_MODEL](state, {tracker: 'tracker3.com', model, canCheck: true})

            expect(state).to.be.eql({
                trackers: [
                    trackers[0],
                    trackers[1],
                    {...trackers[2], model, canCheck: true}
                ] })
        })

        it(`SET_TRACKER_MODEL unknown tracker`, () => {
            const trackers = [
                {name: 'tracker1.com', form: null},
                {name: 'tracker2.com', form: null},
                {name: 'tracker3.com', form: null}
            ]
            const state = {trackers}
            const model = {username: 'username', password: 'password'}
            store.mutations[types.SET_TRACKER_MODEL](state, {tracker: 'tracker4.com', model, canCheck: true})

            expect(state).to.be.eql({trackers})
        })
    })

    describe('actions', () => {
        const trackers = [
            {name: 'tracker1.com', form: null},
            {name: 'tracker2.com', form: null}
        ]

        it('loadTrackers should works', async () => {
            sandbox.stub(api.default.trackers, 'all', () => delay(0, trackers))

            const commit = sandbox.spy()

            await store.actions.loadTrackers({ commit })

            expect(commit).to.have.been.calledOnce
            expect(commit).to.have.been.calledWith(types.SET_TRACKERS, trackers)
        })

        it('loadTrackers should fails on error', async () => {
            const error = Error()
            sandbox.stub(api.default.trackers, 'all', () => delay.reject(0, error))

            const commit = sandbox.spy()

            await store.actions.loadTrackers({ commit })

            expect(commit).to.have.been.calledOnce
            expect(commit).to.have.been.calledWith(types.LOAD_TRACKERS_FAILED, error)
        })

        const responses = {
            'tracker1.com': {
                can_check: true,
                settings: {username: 'username1', password: 'password1'}
            },
            'tracker2.com': {
                can_check: false,
                settings: {username: 'username2', password: 'password2'}
            }
        }

        it(`loadTracker() should dispatch loadTrackers first`, async () => {
            sandbox.stub(api.default.trackers, 'tracker', t => delay(0, responses[t]))

            const commit = sandbox.spy()
            const dispatch = sandbox.spy(() => delay(0))
            const state = {trackers: []}

            await store.actions.loadTracker({ commit, state, dispatch }, 'tracker1.com')

            expect(dispatch).to.have.been.calledOnce
            expect(dispatch).to.have.been.calledWith('loadTrackers')

            expect(commit).to.have.been.calledOnce
            expect(commit).to.have.been.calledWith(types.SET_TRACKER_MODEL, {tracker: 'tracker1.com', model: responses['tracker1.com'].settings, canCheck: true})
        })

        it(`loadTracker() should not dispatch loadTrackers first`, async () => {
            sandbox.stub(api.default.trackers, 'tracker', t => delay(0, responses[t]))

            const commit = sandbox.spy()
            const dispatch = sandbox.spy(() => delay(0))
            const state = {trackers}

            await store.actions.loadTracker({ commit, state, dispatch }, 'tracker2.com')

            expect(dispatch).to.have.not.been.calledOnce

            expect(commit).to.have.been.calledOnce
            expect(commit).to.have.been.calledWith(types.SET_TRACKER_MODEL, {tracker: 'tracker2.com', model: responses['tracker2.com'].settings, canCheck: false})
        })

        it(`loadTracker() exception should not do anything`, async () => {
            sandbox.stub(api.default.trackers, 'tracker', t => delay.reject(0, new Error()))

            const commit = sandbox.spy()
            const dispatch = sandbox.spy(() => delay(0))
            const state = {trackers}

            await store.actions.loadTracker({ commit, state, dispatch }, 'tracker2.com')

            expect(dispatch).to.have.not.been.calledOnce
            expect(commit).to.have.not.been.calledOnce
        })
    })
})