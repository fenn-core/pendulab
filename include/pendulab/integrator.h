#ifndef PENDULAB_INTEGRATOR_H
#define PENDULAB_INTEGRATOR_H

#include "pendulab/precision.h"
#include "pendulab/dynamics.h"


state_t pendulab_rk4(const state_t *state, const parameters_t *params, real_t F,
                     real_t dt);


#endif // PENDULAB_INTEGRATOR_H
