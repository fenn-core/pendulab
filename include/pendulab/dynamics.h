#ifndef PENDULAB_DYNAMICS_H
#define PENDULAB_DYNAMICS_H

#include "pendulab/precision.h"


typedef struct
{
    real_t x;
    real_t theta;
    real_t v;
    real_t omega;
} state_t;


typedef struct
{
    real_t dx;
    real_t dtheta;
    real_t dv;
    real_t domega;
} state_derivative_t;


typedef struct
{
    real_t M;
    real_t m;
    real_t l;
    real_t g;
} parameters_t;


state_derivative_t pendulab_derivative(const state_t *state, const parameters_t *params,
                                       double F);


real_t pendulab_energy(const state_t *state, const parameters_t *params);


real_t pendulab_momentum(const state_t *state, const parameters_t *params);


#endif // PENDULAB_DYNAMICS_H
