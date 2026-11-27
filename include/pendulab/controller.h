#ifndef PENDULAB_CONTROLLER_H
#define PENDULAB_CONTROLLER_H

#include "pendulab/precision.h"
#include "pendulab/dynamics.h"


typedef struct
{
    real_t kx;
    real_t ktheta;
    real_t kv;
    real_t omega;
} lqr_gains_t;


real_t pendulab_lqr(const state_t *state, const lqr_gains_t *gains);


#endif // PENDULAB_CONTROLLER_H