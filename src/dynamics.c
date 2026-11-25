#include "pendulab/dynamics.h"
#include "pendulab/precision.h"


state_derivative_t pendulab_derivative(const state_t *state, const parameters_t *params,
                                       double F)
{
    state_derivative_t state_derivative = {.dx = state->v, .dtheta = state->omega};

    const real_t theta = state->theta;
    const real_t omega = state->omega;
    const real_t l = params->l;
    const real_t m = params->m;
    const real_t M = params->M;
    const real_t g = params->g;

    real_t dv = ((F + m * l * omega * omega * REAL_SIN(theta) -
                  m * g * REAL_SIN(theta) * REAL_COS(theta)) /
                 (M + m * REAL_SIN(theta) * REAL_SIN(theta)));

    real_t domega = (((M + m) * g * REAL_SIN(theta) - F * REAL_COS(theta) -
                      m * l * omega * omega * REAL_SIN(theta) * REAL_COS(theta)) /
                     (l * (M + m * REAL_SIN(theta) * REAL_SIN(theta))));

    state_derivative.dv = dv;
    state_derivative.domega = domega;

    return state_derivative;
}


real_t pendulab_energy(const state_t *state, const parameters_t *params)
{
    const real_t v = state->v;
    const real_t omega = state->omega;
    const real_t theta = state->theta;
    const real_t l = params->l;
    const real_t m = params->m;
    const real_t M = params->M;
    const real_t g = params->g;

    const real_t kinetic_energy = 0.5 * (M + m) * v * v + m * l * v * omega * REAL_COS(theta) +
        0.5 * m * l * l * omega * omega;

    const real_t potential_energy = m * g * l * REAL_COS(theta);

    return kinetic_energy + potential_energy;
}


real_t pendulab_momentum(const state_t *state, const parameters_t *params)
{
    const real_t v = state->v;
    const real_t omega = state->omega;
    const real_t theta = state->theta;
    const real_t l = params->l;
    const real_t m = params->m;
    const real_t M = params->M;

    return (M + m) * v + m * l * omega * REAL_COS(theta);
}
