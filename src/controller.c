#include "pendulab/controller.h"
#include "pendulab/dynamics.h"
#include "pendulab/precision.h"


real_t pendulab_lqr(const state_t *state, const lqr_gains_t *gains)
{
    return -(gains->kx * state->x + gains->ktheta * state->theta + gains->kv * state->v +
             gains->omega * state->omega);
}
