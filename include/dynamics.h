#ifndef PENDULAB_DYNAMICS_H
#define PENDULAB_DYNAMICS_H

#include "precision.h"


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


#endif // PENDULAB_DYNAMICS_H
