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
