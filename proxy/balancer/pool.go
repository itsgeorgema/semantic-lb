package balancer

import "sync/atomic"

type Pool struct {
	upstreams []string
	counter   atomic.Uint64
}

func NewPool(upstreams []string) *Pool {
	return &Pool{upstreams: upstreams}
}

func (p *Pool) Next() string {
	n := p.counter.Add(1) - 1
	return p.upstreams[n%uint64(len(p.upstreams))]
}
