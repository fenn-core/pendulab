#include "pendulab/dynamics.h"
#include "pendulab/precision.h"


static state_t pendulab_advance(const state_t *state,
                                const state_derivative_t *derivative, real_t dt)
{
    state_t advanced_state;

    advanced_state.x = state->x + dt * derivative->dx;
    advanced_state.theta = state->theta + dt * derivative->dtheta;
    advanced_state.v = state->v + dt * derivative->dv;
    advanced_state.omega = state->omega + dt * derivative->domega;

    return advanced_state;
}


state_t pendulab_rk4(const state_t *state, const parameters_t *params, real_t F,
                     real_t dt)
{
    const state_derivative_t derivative = pendulab_derivative(state, params, F);

    const state_derivative_t k1 = pendulab_derivative(state, params, F);

    const state_t k2_state = pendulab_advance(state, &k1, 0.5 * dt);
    const state_derivative_t k2 = pendulab_derivative(&k2_state, params, F);

    const state_t k3_state = pendulab_advance(state, &k2, 0.5 * dt);
    const state_derivative_t k3 = pendulab_derivative(&k3_state, params, F);

    const state_t k4_state = pendulab_advance(state, &k3, dt);
    const state_derivative_t k4 = pendulab_derivative(&k4_state, params, F);

    const state_derivative_t k_bar = {
        .dx = (k1.dx + 2 * k2.dx + 2 * k3.dx + k4.dx) / 6.0,
        .dtheta = (k1.dtheta + 2 * k2.dtheta + 2 * k3.dtheta + k4.dtheta) / 6.0,
        .dv = (k1.dv + 2 * k2.dv + 2 * k3.dv + k4.dv) / 6.0,
        .domega = (k1.domega + 2 * k2.domega + 2 * k3.domega + k4.domega) / 6.0,
    };

    return pendulab_advance(state, &k_bar, dt);
}