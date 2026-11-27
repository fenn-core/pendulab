cmake_minimum_required(VERSION 3.20)
project(pendulab C)

set(CMAKE_EXPORT_COMPILE_COMMANDS ON)
set(CMAKE_C_STANDARD 11)
set(CMAKE_C_STANDARD_REQUIRED ON)
set(CMAKE_C_EXTENSIONS OFF)

add_compile_options(
        -Wall
        -Wextra
        -Wpedantic
        -Werror=return-type
)


add_library(pendulab_core STATIC src/dynamics.c
        src/integrator.c
        include/pendulab/controller.h
        src/controller.c)

target_include_directories(pendulab_core
        PUBLIC ${CMAKE_CURRENT_SOURCE_DIR}/include
        PUBLIC ${CMAKE_CURRENT_SOURCE_DIR}/constants)


add_executable(pendulab_sim
        targets/sim/main.c)

target_link_libraries(pendulab_sim PUBLIC m
        PUBLIC pendulab_core)


