#ifndef PENDULAB_PRECISION_H
#define PENDULAB_PRECISION_H

#include <math.h>

#ifdef PENDULUM_SINGLE_PRECISION

typedef float real_t;

#define REAL_SIN sinf
#define REAL_COS cosf
#define REAL_SQRT sqrtf
#define REAL(x) x##f
#define PRIreal ".9g"
#define SCNreal "f"

#else

typedef double real_t;

#define REAL_SIN sin
#define REAL_COS cos
#define REAL_SQRT sqrt
#define REAL(x) x
#define PRIreal ".17g"
#define SCNreal "lf"

#endif

#endif // PENDULAB_PRECISION_H
