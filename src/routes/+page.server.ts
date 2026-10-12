// Sonder 'n `load` vra die kliënt nie die bediener by 'n navigasie nie, en die wag in
// hooks.server.ts (aangemeld → /tuis) loop nooit. 'n Leë `load` genoeg om dit af te dwing.
export const load = () => ({});
