// Sonder 'n `load` vra die kliënt nie die bediener by 'n navigasie in hierdie groep nie, en die
// wagte in hooks.server.ts loop nooit. 'n Leë `load` genoeg om dit af te dwing.
export const load = () => ({});
